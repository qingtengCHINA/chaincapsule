import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

const { ethers } = hre;

describe("ChainCapsule", function () {
  async function deployFixture() {
    const [owner, creator, recipient, stranger] = await ethers.getSigners();
    const ChainCapsule = await ethers.getContractFactory("ChainCapsule");
    const capsule = await ChainCapsule.deploy();
    return { capsule, owner, creator, recipient, stranger };
  }

  async function mineBlocks(n: number) {
    for (let i = 0; i < n; i++) {
      await ethers.provider.send("evm_mine", []);
    }
  }

  // ─── Constants ────────────────────────────────────────────────
  describe("constants", function () {
    it("has correct MIN_LOCK_BLOCKS (200 = ~10 min)", async function () {
      const { capsule } = await loadFixture(deployFixture);
      expect(await capsule.MIN_LOCK_BLOCKS()).to.equal(200);
    });

    it("has correct MAX_LOCK_BLOCKS (200 years)", async function () {
      const { capsule } = await loadFixture(deployFixture);
      expect(await capsule.MAX_LOCK_BLOCKS()).to.equal(2_103_840_000);
    });

    it("has correct MAX_TITLE_LENGTH", async function () {
      const { capsule } = await loadFixture(deployFixture);
      expect(await capsule.MAX_TITLE_LENGTH()).to.equal(100);
    });

    it("has correct MAX_BNB_PER_CAPSULE", async function () {
      const { capsule } = await loadFixture(deployFixture);
      expect(await capsule.MAX_BNB_PER_CAPSULE()).to.equal(ethers.parseEther("1000"));
    });
  });

  // ─── createCapsule ────────────────────────────────────────────
  describe("createCapsule", function () {
    it("creates a capsule with correct data", async function () {
      const { capsule, creator, recipient } = await loadFixture(deployFixture);
      const title = "给未来的信";
      const contentHash = "QmTestHash123456789";
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;
      const bnbAmount = ethers.parseEther("0.1");

      await expect(
        capsule.connect(creator).createCapsule(title, contentHash, unlockBlock, true, recipient.address, { value: bnbAmount })
      ).to.emit(capsule, "CapsuleCreated");

      const c = await capsule.getCapsule(1);
      expect(c.creator).to.equal(creator.address);
      expect(c.title).to.equal(title);
      expect(c.contentHash).to.equal(contentHash);
      expect(c.unlockBlock).to.equal(unlockBlock);
      expect(c.bnbAmount).to.equal(bnbAmount);
      expect(c.isOpened).to.equal(false);
      expect(c.isPublic).to.equal(true);
      expect(c.bnbWithdrawn).to.equal(false);
      expect(c.recipient).to.equal(recipient.address);
    });

    it("creates capsule without BNB", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress);

      const c = await capsule.getCapsule(1);
      expect(c.bnbAmount).to.equal(0);
    });

    it("increments totalCapsules", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      expect(await capsule.totalCapsules()).to.equal(0);

      await capsule.connect(creator).createCapsule("标题1", "QmHash1", unlockBlock, false, ethers.ZeroAddress);
      expect(await capsule.totalCapsules()).to.equal(1);

      await capsule.connect(creator).createCapsule("标题2", "QmHash2", unlockBlock + 1, false, ethers.ZeroAddress);
      expect(await capsule.totalCapsules()).to.equal(2);
    });

    it("tracks user capsule count", async function () {
      const { capsule, creator, recipient } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      expect(await capsule.getUserCapsuleCount(creator.address)).to.equal(0);

      await capsule.connect(creator).createCapsule("标题1", "QmHash1", unlockBlock, false, ethers.ZeroAddress);
      expect(await capsule.getUserCapsuleCount(creator.address)).to.equal(1);

      await capsule.connect(creator).createCapsule("标题2", "QmHash2", unlockBlock + 1, false, ethers.ZeroAddress);
      expect(await capsule.getUserCapsuleCount(creator.address)).to.equal(2);

      // Different user
      expect(await capsule.getUserCapsuleCount(recipient.address)).to.equal(0);
    });

    it("fails with empty title", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      await expect(
        capsule.connect(creator).createCapsule("", "QmHash", unlockBlock, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "InvalidTitle");
    });

    it("fails with title at exactly MAX_TITLE_LENGTH + 1 (101 chars)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;
      const longTitle = "a".repeat(101);

      await expect(
        capsule.connect(creator).createCapsule(longTitle, "QmHash", unlockBlock, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "InvalidTitle");
    });

    it("succeeds with title at exactly MAX_TITLE_LENGTH (100 chars)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;
      const exactTitle = "a".repeat(100);

      await expect(
        capsule.connect(creator).createCapsule(exactTitle, "QmHash", unlockBlock, false, ethers.ZeroAddress)
      ).to.emit(capsule, "CapsuleCreated");

      const c = await capsule.getCapsule(1);
      expect(c.title).to.equal(exactTitle);
    });

    it("fails with empty content hash", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      await expect(
        capsule.connect(creator).createCapsule("标题", "", unlockBlock, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "InvalidContent");
    });

    it("fails with unlock block in the past", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();

      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", currentBlock, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "InvalidUnlockBlock");
    });

    it("fails with lock duration too short (< 200 blocks)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();

      // 199 blocks ahead — should fail
      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", currentBlock + 199, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "LockTooShort");
    });

    it("succeeds with lock duration at exactly MIN_LOCK_BLOCKS (200 blocks)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();

      // Use 201 because createCapsule tx mines 1 block, so effective lock = 200
      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", currentBlock + 201, false, ethers.ZeroAddress)
      ).to.emit(capsule, "CapsuleCreated");
    });

    it("fails with lock duration too long (> MAX_LOCK_BLOCKS)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();

      // Use +2 to account for the block mined by createCapsule tx
      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", currentBlock + 2_103_840_002, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "LockTooLong");
    });

    it("succeeds with lock duration at exactly MAX_LOCK_BLOCKS", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();

      // Use +2_103_840_001 because createCapsule tx mines 1 block, effective lock = 2_103_840_000
      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", currentBlock + 2_103_840_001, false, ethers.ZeroAddress)
      ).to.emit(capsule, "CapsuleCreated");
    });

    it("fails with BNB amount too high", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
          value: ethers.parseEther("1001"),
        })
      ).to.be.revertedWithCustomError(capsule, "BnbAmountTooHigh");
    });

    it("creator = recipient is the same person (no separate recipient)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      // recipient = address(0) means creator only
      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress);

      const c = await capsule.getCapsule(1);
      expect(c.recipient).to.equal(ethers.ZeroAddress);
      expect(c.creator).to.equal(creator.address);
    });
  });

  // ─── openCapsule ──────────────────────────────────────────────
  describe("openCapsule", function () {
    it("fails to open before unlock block", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      await expect(capsule.connect(creator).openCapsule(1)).to.be.revertedWithCustomError(
        capsule, "CapsuleNotReady"
      );
    });

    it("opens capsule after unlock block — does NOT transfer BNB", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;
      const bnbAmount = ethers.parseEther("0.5");

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: bnbAmount,
      });

      await mineBlocks(210);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await capsule.connect(creator).openCapsule(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      const c = await capsule.getCapsule(1);
      expect(c.isOpened).to.equal(true);
      expect(c.openedAt).to.be.greaterThan(0);

      // BNB should NOT be transferred on open
      expect(balanceAfter + gasCost - balanceBefore).to.equal(0n);
    });

    it("fails to open already opened capsule", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(creator).openCapsule(1)).to.be.revertedWithCustomError(
        capsule, "CapsuleAlreadyOpened"
      );
    });

    it("only authorized user (creator or recipient) can open", async function () {
      const { capsule, creator, recipient, stranger } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, recipient.address, { value: 0 });

      await mineBlocks(210);

      // Stranger cannot open
      await expect(capsule.connect(stranger).openCapsule(1)).to.be.revertedWithCustomError(
        capsule, "NotAuthorized"
      );

      // Recipient can open
      await expect(capsule.connect(recipient).openCapsule(1)).to.emit(capsule, "CapsuleOpened");
    });

    it("creator can open when recipient is address(0)", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });
      await mineBlocks(210);

      await expect(capsule.connect(creator).openCapsule(1)).to.emit(capsule, "CapsuleOpened");
    });

    it("returns correct blocks until unlock", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();
      const unlockBlock = currentBlock + 250;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      const remaining = await capsule.getBlocksUntilUnlock(1);
      // createCapsule tx mines one more block, so remaining is 249
      expect(remaining).to.equal(249);
    });
  });

  // ─── withdrawBnb ──────────────────────────────────────────────
  describe("withdrawBnb", function () {
    it("fails before capsule is opened", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule, "CapsuleNotReady"
      );
    });

    it("transfers BNB to opener after opening", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;
      const bnbAmount = ethers.parseEther("1");

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: bnbAmount,
      });

      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await capsule.connect(creator).withdrawBnb(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      expect(balanceAfter + gasCost - balanceBefore).to.equal(bnbAmount);

      const c = await capsule.getCapsule(1);
      expect(c.bnbWithdrawn).to.equal(true);
      expect(c.withdrawnAt).to.be.greaterThan(0);
    });

    it("fails if no BNB attached", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule, "NoBnbToWithdraw"
      );
    });

    it("fails on double withdrawal", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("0.5"),
      });

      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);
      await capsule.connect(creator).withdrawBnb(1);

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule, "BnbAlreadyWithdrawn"
      );
    });

    it("recipient who opened can also withdraw", async function () {
      const { capsule, creator, recipient } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;
      const bnbAmount = ethers.parseEther("0.3");

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, recipient.address, {
        value: bnbAmount,
      });

      await mineBlocks(210);
      await capsule.connect(recipient).openCapsule(1);

      const balanceBefore = await ethers.provider.getBalance(recipient.address);
      const tx = await capsule.connect(recipient).withdrawBnb(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(recipient.address);

      expect(balanceAfter + gasCost - balanceBefore).to.equal(bnbAmount);
    });

    it("stranger cannot withdraw", async function () {
      const { capsule, creator, recipient, stranger } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, recipient.address, {
        value: ethers.parseEther("0.5"),
      });

      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(stranger).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule, "NotAuthorized"
      );
    });
  });

  // ─── reclaimBnb ───────────────────────────────────────────────
  describe("reclaimBnb", function () {
    it("fails before unlock block", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      // Not yet at unlock block
      await expect(capsule.connect(creator).reclaimBnb(1)).to.be.revertedWithCustomError(
        capsule, "ReclaimNotReady"
      );
    });

    it("fails after unlock but before reclaim delay", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      await mineBlocks(210); // Past unlock block

      await expect(capsule.connect(creator).reclaimBnb(1)).to.be.revertedWithCustomError(
        capsule, "ReclaimNotReady"
      );
    });

    it("only creator can reclaim", async function () {
      const { capsule, creator, stranger } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      await expect(capsule.connect(stranger).reclaimBnb(1)).to.be.revertedWithCustomError(
        capsule, "NotCreator"
      );
    });

    it("recipient cannot reclaim (only creator)", async function () {
      const { capsule, creator, recipient } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, recipient.address, {
        value: ethers.parseEther("1"),
      });

      // Recipient is not creator, should fail
      await expect(capsule.connect(recipient).reclaimBnb(1)).to.be.revertedWithCustomError(
        capsule, "NotCreator"
      );
    });

    it("returns correct reclaim block", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("0.1"),
      });

      const reclaimBlock = await capsule.getReclaimBlock(1);
      expect(reclaimBlock).to.equal(BigInt(unlockBlock) + 10_512_000n);
    });

    it("returns 0 for reclaim block if no BNB", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      const reclaimBlock = await capsule.getReclaimBlock(1);
      expect(reclaimBlock).to.equal(0);
    });

    it("returns 0 for reclaim block if already withdrawn", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("0.5"),
      });

      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);
      await capsule.connect(creator).withdrawBnb(1);

      const reclaimBlock = await capsule.getReclaimBlock(1);
      expect(reclaimBlock).to.equal(0);
    });
  });

  // ─── pause ────────────────────────────────────────────────────
  describe("pause", function () {
    it("owner can pause and unpause", async function () {
      const { capsule, owner, creator } = await loadFixture(deployFixture);

      await capsule.connect(owner).pause();

      const unlockBlock = (await ethers.provider.getBlockNumber()) + 1000;
      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 })
      ).to.be.revertedWithCustomError(capsule, "EnforcedPause");

      await capsule.connect(owner).unpause();

      await expect(
        capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 })
      ).to.emit(capsule, "CapsuleCreated");
    });

    it("pause blocks openCapsule", async function () {
      const { capsule, owner, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });
      await mineBlocks(210);

      await capsule.connect(owner).pause();

      await expect(capsule.connect(creator).openCapsule(1)).to.be.revertedWithCustomError(
        capsule, "EnforcedPause"
      );
    });

    it("pause blocks withdrawBnb", async function () {
      const { capsule, owner, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 210;

      await capsule.connect(creator).createCapsule("标题", "QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });
      await mineBlocks(210);
      await capsule.connect(creator).openCapsule(1);

      await capsule.connect(owner).pause();

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule, "EnforcedPause"
      );
    });

    it("non-owner cannot pause", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);

      await expect(capsule.connect(creator).pause()).to.be.revertedWithCustomError(
        capsule, "OwnableUnauthorizedAccount"
      );
    });
  });

  // ─── Non-existent capsule ─────────────────────────────────────
  describe("non-existent capsule", function () {
    it("getCapsule returns zero struct for non-existent ID", async function () {
      const { capsule } = await loadFixture(deployFixture);
      const c = await capsule.getCapsule(999);
      expect(c.id).to.equal(0);
      expect(c.creator).to.equal(ethers.ZeroAddress);
    });

    it("openCapsule reverts for non-existent capsule", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      await expect(capsule.connect(creator).openCapsule(999)).to.be.revertedWithCustomError(
        capsule, "NotAuthorized"
      );
    });
  });
});
