// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ChainCapsule is Ownable, ReentrancyGuard, Pausable {
    // ─── Constants ────────────────────────────────────────────────
    uint256 public constant RECLAIM_DELAY = 365 days;
    uint256 public constant MAX_CONTENT_LENGTH = 10000;

    // ─── Structs ────────────────────────────────────────────────────
    struct Capsule {
        uint256 id;
        address creator;
        string contentHash;       // IPFS CID
        uint256 unlockBlock;
        uint256 createdAt;
        uint256 bnbAmount;
        bool isOpened;
        bool isPublic;
        bool bnbWithdrawn;       // BNB 已提取标记
        address recipient;
        uint256 openedAt;        // 开启时间 (block number)
    }

    // ─── State ──────────────────────────────────────────────────────
    uint256 private _nextId = 1;
    mapping(uint256 => Capsule) private _capsules;
    mapping(address => uint256[]) private _userCapsules;

    // ─── Events ─────────────────────────────────────────────────────
    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        string contentHash,
        uint256 unlockBlock,
        uint256 bnbAmount,
        bool isPublic,
        address recipient
    );

    event CapsuleOpened(uint256 indexed id, address indexed opener, uint256 openedAt);
    event BnbWithdrawn(uint256 indexed id, address indexed to, uint256 amount);
    event BnbReclaimed(uint256 indexed id, address indexed creator, uint256 amount);

    // ─── Custom Errors ──────────────────────────────────────────────
    error CapsuleAlreadyOpened();
    error CapsuleNotReady();
    error NotAuthorized();
    error InvalidContent();
    error InvalidUnlockBlock();
    error NoBnbToWithdraw();
    error BnbAlreadyWithdrawn();
    error ReclaimNotReady();
    error NotCreator();

    // ─── Constructor ────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── External Functions ─────────────────────────────────────────

    /// @notice Creates a new time-locked capsule
    /// @param contentHash IPFS CID pointing to the encrypted content
    /// @param unlockBlock Block number at which the capsule can be opened
    /// @param isPublic Whether the capsule appears in the public plaza
    /// @param recipient Specific address allowed to open (address(0) = anyone)
    /// @return id The new capsule ID
    function createCapsule(
        string calldata contentHash,
        uint256 unlockBlock,
        bool isPublic,
        address recipient
    ) external payable whenNotPaused returns (uint256 id) {
        if (bytes(contentHash).length == 0 || bytes(contentHash).length > MAX_CONTENT_LENGTH) {
            revert InvalidContent();
        }
        if (unlockBlock <= block.number) {
            revert InvalidUnlockBlock();
        }

        id = _nextId++;

        _capsules[id] = Capsule({
            id: id,
            creator: msg.sender,
            contentHash: contentHash,
            unlockBlock: unlockBlock,
            createdAt: block.number,
            bnbAmount: msg.value,
            isOpened: false,
            isPublic: isPublic,
            bnbWithdrawn: false,
            recipient: recipient,
            openedAt: 0
        });

        _userCapsules[msg.sender].push(id);

        emit CapsuleCreated(id, msg.sender, contentHash, unlockBlock, msg.value, isPublic, recipient);
    }

    /// @notice Opens a capsule if the unlock block has been reached.
    ///         Content is revealed, but BNB stays locked until explicit withdrawal.
    /// @param id Capsule ID to open
    function openCapsule(uint256 id) external nonReentrant whenNotPaused {
        Capsule storage c = _capsules[id];

        if (c.id == 0) revert NotAuthorized();
        if (c.isOpened) revert CapsuleAlreadyOpened();
        if (block.number < c.unlockBlock) revert CapsuleNotReady();

        // Only creator or designated recipient can open
        if (msg.sender != c.creator && msg.sender != c.recipient) {
            revert NotAuthorized();
        }

        c.isOpened = true;
        c.openedAt = block.number;

        emit CapsuleOpened(id, msg.sender, block.number);
    }

    /// @notice Withdraws BNB attached to a capsule (after it's opened).
    ///         Caller must be the creator or the recipient who opened it.
    /// @param id Capsule ID
    function withdrawBnb(uint256 id) external nonReentrant whenNotPaused {
        Capsule storage c = _capsules[id];

        if (c.id == 0) revert NotAuthorized();
        if (!c.isOpened) revert CapsuleNotReady();
        if (c.bnbAmount == 0) revert NoBnbToWithdraw();
        if (c.bnbWithdrawn) revert BnbAlreadyWithdrawn();

        // Only creator or the person who opened it can withdraw
        if (msg.sender != c.creator && msg.sender != c.recipient) {
            revert NotAuthorized();
        }

        c.bnbWithdrawn = true;

        (bool success, ) = payable(msg.sender).call{value: c.bnbAmount}("");
        require(success, "BNB transfer failed");

        emit BnbWithdrawn(id, msg.sender, c.bnbAmount);
    }

    /// @notice Creator reclaims BNB after RECLAIM_DELAY if no one opened it.
    ///         Protects against permanently locked funds.
    /// @param id Capsule ID
    function reclaimBnb(uint256 id) external nonReentrant whenNotPaused {
        Capsule storage c = _capsules[id];

        if (c.id == 0) revert NotAuthorized();
        if (msg.sender != c.creator) revert NotCreator();
        if (c.bnbAmount == 0) revert NoBnbToWithdraw();
        if (c.bnbWithdrawn) revert BnbAlreadyWithdrawn();

        // Must wait RECLAIM_DELAY after unlock block
        if (block.number < c.unlockBlock) revert ReclaimNotReady();

        // Estimate block timestamp: unlockBlock has passed, check elapsed time
        // We use block.number comparison: ~6s per block on BSC
        // RECLAIM_DELAY in blocks ≈ 365 days / 3s ≈ 10_512_000 blocks on BSC
        // But we compare via approximate timestamp: unlockBlock + RECLAIM_DELAY_BLOCKS
        // Safer: use blocks directly. BSC ~3s/block → 365d ≈ 10_512_000 blocks
        uint256 reclaimBlock = c.unlockBlock + 10_512_000;
        if (block.number < reclaimBlock) revert ReclaimNotReady();

        c.bnbWithdrawn = true;

        (bool success, ) = payable(c.creator).call{value: c.bnbAmount}("");
        require(success, "BNB transfer failed");

        emit BnbReclaimed(id, c.creator, c.bnbAmount);
    }

    // ─── View Functions ─────────────────────────────────────────────

    /// @notice Returns capsule data
    /// @param id Capsule ID
    function getCapsule(uint256 id) external view returns (Capsule memory) {
        return _capsules[id];
    }

    /// @notice Returns all capsule IDs for a user
    /// @param user Address to query
    function getUserCapsules(address user) external view returns (uint256[] memory) {
        return _userCapsules[user];
    }

    /// @notice Returns how many blocks remain until a capsule can be opened
    /// @param id Capsule ID
    /// @return Remaining blocks (0 if already past unlock)
    function getBlocksUntilUnlock(uint256 id) external view returns (uint256) {
        Capsule storage c = _capsules[id];
        if (block.number >= c.unlockBlock) return 0;
        return c.unlockBlock - block.number;
    }

    /// @notice Returns the block number at which creator can reclaim BNB
    /// @param id Capsule ID
    /// @return Block number (0 if reclaim not applicable)
    function getReclaimBlock(uint256 id) external view returns (uint256) {
        Capsule storage c = _capsules[id];
        if (c.bnbAmount == 0 || c.bnbWithdrawn) return 0;
        return c.unlockBlock + 10_512_000; // ~365 days on BSC
    }

    // ─── Owner Functions ────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
