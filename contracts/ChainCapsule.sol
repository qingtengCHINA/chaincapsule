// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract ChainCapsule is Ownable, ReentrancyGuard, Pausable {
    // ─── Structs ────────────────────────────────────────────────────
    struct Capsule {
        uint256 id;
        address creator;
        string contentHash; // IPFS CID
        uint256 unlockBlock;
        uint256 createdAt;
        uint256 bnbAmount;
        bool isOpened;
        bool isPublic;
        address recipient;
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

    event CapsuleOpened(uint256 indexed id, address indexed opener);

    // ─── Custom Errors ──────────────────────────────────────────────
    error CapsuleAlreadyOpened();
    error CapsuleNotReady();
    error NotAuthorized();
    error InvalidContent();
    error InvalidUnlockBlock();

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
        if (bytes(contentHash).length == 0 || bytes(contentHash).length > 10000) {
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
            recipient: recipient
        });

        _userCapsules[msg.sender].push(id);

        emit CapsuleCreated(id, msg.sender, contentHash, unlockBlock, msg.value, isPublic, recipient);
    }

    /// @notice Opens a capsule if the unlock block has been reached
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

        // Send BNB to opener
        if (c.bnbAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: c.bnbAmount}("");
            require(success, "BNB transfer failed");
        }

        emit CapsuleOpened(id, msg.sender);
    }

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

    // ─── Owner Functions ────────────────────────────────────────────

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
