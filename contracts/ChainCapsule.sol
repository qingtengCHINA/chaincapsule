// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ChainCapsule is Ownable, ReentrancyGuard, Pausable {
    // ─── Constants ────────────────────────────────────────────────
    uint256 public constant RECLAIM_DELAY = 365 days;
    uint256 public constant MAX_CONTENT_LENGTH = 10000;
    uint256 public constant MAX_BNB_PER_CAPSULE = 1000 ether;
    uint256 public constant MAX_TITLE_LENGTH = 100;

    // ─── Structs ────────────────────────────────────────────────────
    struct Capsule {
        uint256 id;
        address creator;
        string title;             // 公开标题（不加密）
        string contentHash;       // IPFS CID（内容加密存储）
        uint256 unlockBlock;
        uint256 createdAt;        // block number
        uint256 bnbAmount;
        bool isOpened;
        bool isPublic;
        bool bnbWithdrawn;
        address recipient;
        uint256 openedAt;         // block number when opened
        uint256 withdrawnAt;      // block number when BNB withdrawn
    }

    // ─── State ──────────────────────────────────────────────────────
    uint256 private _nextId = 1;
    mapping(uint256 => Capsule) private _capsules;
    mapping(address => uint256[]) private _userCapsules;

    // ─── Events ─────────────────────────────────────────────────────
    event CapsuleCreated(
        uint256 indexed id,
        address indexed creator,
        string title,
        string contentHash,
        uint256 unlockBlock,
        uint256 bnbAmount,
        bool isPublic,
        address recipient
    );

    event CapsuleOpened(uint256 indexed id, address indexed opener, uint256 openedAt);
    event BnbWithdrawn(uint256 indexed id, address indexed to, uint256 amount, uint256 withdrawnAt);
    event BnbReclaimed(uint256 indexed id, address indexed creator, uint256 amount);

    // ─── Custom Errors ──────────────────────────────────────────────
    error CapsuleAlreadyOpened();
    error CapsuleNotReady();
    error NotAuthorized();
    error InvalidContent();
    error InvalidTitle();
    error InvalidUnlockBlock();
    error BnbAmountTooHigh();
    error NoBnbToWithdraw();
    error BnbAlreadyWithdrawn();
    error ReclaimNotReady();
    error NotCreator();

    // ─── Constructor ────────────────────────────────────────────────
    constructor() Ownable(msg.sender) {}

    // ─── External Functions ─────────────────────────────────────────

    /// @notice Creates a new time-locked capsule
    /// @param title Public title (stored on-chain, unencrypted)
    /// @param contentHash IPFS CID pointing to the encrypted content
    /// @param unlockBlock Block number at which the capsule can be opened
    /// @param isPublic Whether the capsule appears in the public plaza
    /// @param recipient Specific address allowed to open (address(0) = anyone)
    /// @return id The new capsule ID
    function createCapsule(
        string calldata title,
        string calldata contentHash,
        uint256 unlockBlock,
        bool isPublic,
        address recipient
    ) external payable whenNotPaused returns (uint256 id) {
        if (bytes(title).length == 0 || bytes(title).length > MAX_TITLE_LENGTH) {
            revert InvalidTitle();
        }
        if (bytes(contentHash).length == 0 || bytes(contentHash).length > MAX_CONTENT_LENGTH) {
            revert InvalidContent();
        }
        if (unlockBlock <= block.number) {
            revert InvalidUnlockBlock();
        }
        if (msg.value > MAX_BNB_PER_CAPSULE) {
            revert BnbAmountTooHigh();
        }

        id = _nextId++;

        _capsules[id] = Capsule({
            id: id,
            creator: msg.sender,
            title: title,
            contentHash: contentHash,
            unlockBlock: unlockBlock,
            createdAt: block.number,
            bnbAmount: msg.value,
            isOpened: false,
            isPublic: isPublic,
            bnbWithdrawn: false,
            recipient: recipient,
            openedAt: 0,
            withdrawnAt: 0
        });

        _userCapsules[msg.sender].push(id);

        emit CapsuleCreated(id, msg.sender, title, contentHash, unlockBlock, msg.value, isPublic, recipient);
    }

    /// @notice Opens a capsule if the unlock block has been reached.
    function openCapsule(uint256 id) external nonReentrant whenNotPaused {
        Capsule storage c = _capsules[id];

        if (c.id == 0) revert NotAuthorized();
        if (c.isOpened) revert CapsuleAlreadyOpened();
        if (block.number < c.unlockBlock) revert CapsuleNotReady();

        if (msg.sender != c.creator && msg.sender != c.recipient) {
            revert NotAuthorized();
        }

        c.isOpened = true;
        c.openedAt = block.number;

        emit CapsuleOpened(id, msg.sender, block.number);
    }

    /// @notice Withdraws BNB attached to a capsule (after it's opened).
    function withdrawBnb(uint256 id) external nonReentrant whenNotPaused {
        Capsule storage c = _capsules[id];

        if (c.id == 0) revert NotAuthorized();
        if (!c.isOpened) revert CapsuleNotReady();
        if (c.bnbAmount == 0) revert NoBnbToWithdraw();
        if (c.bnbWithdrawn) revert BnbAlreadyWithdrawn();

        if (msg.sender != c.creator && msg.sender != c.recipient) {
            revert NotAuthorized();
        }

        c.bnbWithdrawn = true;
        c.withdrawnAt = block.number;

        (bool success, ) = payable(msg.sender).call{value: c.bnbAmount}("");
        require(success, "BNB transfer failed");

        emit BnbWithdrawn(id, msg.sender, c.bnbAmount, block.number);
    }

    /// @notice Creator reclaims BNB after RECLAIM_DELAY if no one opened it.
    function reclaimBnb(uint256 id) external nonReentrant whenNotPaused {
        Capsule storage c = _capsules[id];

        if (c.id == 0) revert NotAuthorized();
        if (msg.sender != c.creator) revert NotCreator();
        if (c.bnbAmount == 0) revert NoBnbToWithdraw();
        if (c.bnbWithdrawn) revert BnbAlreadyWithdrawn();

        if (block.number < c.unlockBlock) revert ReclaimNotReady();

        uint256 reclaimBlock = c.unlockBlock + 10_512_000;
        if (block.number < reclaimBlock) revert ReclaimNotReady();

        c.bnbWithdrawn = true;
        c.withdrawnAt = block.number;

        (bool success, ) = payable(c.creator).call{value: c.bnbAmount}("");
        require(success, "BNB transfer failed");

        emit BnbReclaimed(id, c.creator, c.bnbAmount);
    }

    // ─── View Functions ─────────────────────────────────────────────

    function getCapsule(uint256 id) external view returns (Capsule memory) {
        return _capsules[id];
    }

    function getUserCapsules(address user) external view returns (uint256[] memory) {
        return _userCapsules[user];
    }

    function getBlocksUntilUnlock(uint256 id) external view returns (uint256) {
        Capsule storage c = _capsules[id];
        if (block.number >= c.unlockBlock) return 0;
        return c.unlockBlock - block.number;
    }

    function getReclaimBlock(uint256 id) external view returns (uint256) {
        Capsule storage c = _capsules[id];
        if (c.bnbAmount == 0 || c.bnbWithdrawn) return 0;
        return c.unlockBlock + 10_512_000;
    }

    // ─── Owner Functions ────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
