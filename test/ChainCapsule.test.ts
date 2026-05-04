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

  // Helper: mine N blocks
  async function mineBlocks(n: number) {
    for (let i = 0; i < n; i++) {
      await ethers.provider.send("evm_mine", []);
    }
  }

  describe("createCapsule", function () {
    it("creates a capsule with correct data", async function () {
      const { capsule, creator, recipient } = await loadFixture(deployFixture);
      const contentHash = "QmTestHash123456789";
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 100;
      const bnbAmount = ethers.parseEther("0.1");

      await expect(
        capsule.connect(creator).createCapsule(contentHash, unlockBlock, true, recipient.address, { value: bnbAmount })
      ).to.emit(capsule, "CapsuleCreated");

      const c = await capsule.getCapsule(1);
      expect(c.creator).to.equal(creator.address);
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
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 100;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress);

      const c = await capsule.getCapsule(1);
      expect(c.bnbAmount).to.equal(0);
    });

    it("fails with empty content hash", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 100;

      await expect(
        capsule.connect(creator).createCapsule("", unlockBlock, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "InvalidContent");
    });

    it("fails with unlock block in the past", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();

      await expect(
        capsule.connect(creator).createCapsule("QmHash", currentBlock, false, ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(capsule, "InvalidUnlockBlock");
    });
  });

  describe("openCapsule", function () {
    it("fails to open before unlock block", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 100;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      await expect(capsule.connect(creator).openCapsule(1)).to.be.revertedWithCustomError(
        capsule,
        "CapsuleNotReady"
      );
    });

    it("opens capsule after unlock block — does NOT transfer BNB", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;
      const bnbAmount = ethers.parseEther("0.5");

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: bnbAmount,
      });

      await mineBlocks(10);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await capsule.connect(creator).openCapsule(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      const c = await capsule.getCapsule(1);
      expect(c.isOpened).to.equal(true);
      expect(c.openedAt).to.be.greaterThan(0);

      // BNB should NOT be transferred on open — only content is revealed
      expect(balanceAfter + gasCost - balanceBefore).to.equal(0n);
    });

    it("fails to open already opened capsule", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      await mineBlocks(10);
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(creator).openCapsule(1)).to.be.revertedWithCustomError(
        capsule,
        "CapsuleAlreadyOpened"
      );
    });

    it("only authorized user (creator or recipient) can open", async function () {
      const { capsule, creator, recipient, stranger } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, recipient.address, { value: 0 });

      await mineBlocks(10);

      // Stranger cannot open
      await expect(capsule.connect(stranger).openCapsule(1)).to.be.revertedWithCustomError(
        capsule,
        "NotAuthorized"
      );

      // Recipient can open
      await expect(capsule.connect(recipient).openCapsule(1)).to.emit(capsule, "CapsuleOpened");
    });

    it("returns correct blocks until unlock", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const currentBlock = await ethers.provider.getBlockNumber();
      const unlockBlock = currentBlock + 50;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      const remaining = await capsule.getBlocksUntilUnlock(1);
      // createCapsule tx mines one more block, so remaining is 49
      expect(remaining).to.equal(49);
    });
  });

  describe("withdrawBnb", function () {
    it("fails before capsule is opened", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule,
        "CapsuleNotReady"
      );
    });

    it("transfers BNB to opener after opening", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;
      const bnbAmount = ethers.parseEther("1");

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: bnbAmount,
      });

      await mineBlocks(10);
      await capsule.connect(creator).openCapsule(1);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await capsule.connect(creator).withdrawBnb(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      expect(balanceAfter + gasCost - balanceBefore).to.equal(bnbAmount);

      const c = await capsule.getCapsule(1);
      expect(c.bnbWithdrawn).to.equal(true);
    });

    it("fails if no BNB attached", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      await mineBlocks(10);
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule,
        "NoBnbToWithdraw"
      );
    });

    it("fails on double withdrawal", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("0.5"),
      });

      await mineBlocks(10);
      await capsule.connect(creator).openCapsule(1);
      await capsule.connect(creator).withdrawBnb(1);

      await expect(capsule.connect(creator).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule,
        "BnbAlreadyWithdrawn"
      );
    });

    it("recipient who opened can also withdraw", async function () {
      const { capsule, creator, recipient } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;
      const bnbAmount = ethers.parseEther("0.3");

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, recipient.address, {
        value: bnbAmount,
      });

      await mineBlocks(10);
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
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, recipient.address, {
        value: ethers.parseEther("0.5"),
      });

      await mineBlocks(10);
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(stranger).withdrawBnb(1)).to.be.revertedWithCustomError(
        capsule,
        "NotAuthorized"
      );
    });
  });

  describe("reclaimBnb", function () {
    it("fails before reclaim delay", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      await mineBlocks(10);

      await expect(capsule.connect(creator).reclaimBnb(1)).to.be.revertedWithCustomError(
        capsule,
        "ReclaimNotReady"
      );
    });

    it("only creator can reclaim", async function () {
      const { capsule, creator, stranger } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("1"),
      });

      await mineBlocks(10);

      await expect(capsule.connect(stranger).reclaimBnb(1)).to.be.revertedWithCustomError(
        capsule,
        "NotCreator"
      );
    });

    it("returns correct reclaim block", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: ethers.parseEther("0.1"),
      });

      const reclaimBlock = await capsule.getReclaimBlock(1);
      expect(reclaimBlock).to.equal(BigInt(unlockBlock) + 10_512_000n);
    });

    it("returns 0 for reclaim block if no BNB", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      const reclaimBlock = await capsule.getReclaimBlock(1);
      expect(reclaimBlock).to.equal(0);
    });
  });

  describe("pause", function () {
    it("owner can pause and unpause", async function () {
      const { capsule, owner, creator } = await loadFixture(deployFixture);

      await capsule.connect(owner).pause();

      const unlockBlock = (await ethers.provider.getBlockNumber()) + 100;
      await expect(
        capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 })
      ).to.be.revertedWithCustomError(capsule, "EnforcedPause");

      await capsule.connect(owner).unpause();

      await expect(
        capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 })
      ).to.emit(capsule, "CapsuleCreated");
    });
  });
});
