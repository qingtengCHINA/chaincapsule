import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("ChainCapsule", function () {
  async function deployFixture() {
    const [owner, creator, recipient, stranger] = await ethers.getSigners();
    const ChainCapsule = await ethers.getContractFactory("ChainCapsule");
    const capsule = await ChainCapsule.deploy();
    return { capsule, owner, creator, recipient, stranger };
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
      expect(c.recipient).to.equal(recipient.address);
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

    it("opens capsule after unlock block and sends BNB", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      // Use +10 to ensure unlockBlock is still in the future after createCapsule mines a block
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;
      const bnbAmount = ethers.parseEther("0.5");

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, {
        value: bnbAmount,
      });

      // Mine enough blocks to pass the unlock block
      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await capsule.connect(creator).openCapsule(1);
      const receipt = await tx.wait();
      const gasCost = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      const c = await capsule.getCapsule(1);
      expect(c.isOpened).to.equal(true);
      expect(balanceAfter + gasCost - balanceBefore).to.equal(bnbAmount);
    });

    it("fails to open already opened capsule", async function () {
      const { capsule, creator } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, ethers.ZeroAddress, { value: 0 });

      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }
      await capsule.connect(creator).openCapsule(1);

      await expect(capsule.connect(creator).openCapsule(1)).to.be.revertedWithCustomError(
        capsule,
        "CapsuleAlreadyOpened"
      );
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

    it("only authorized user (creator or recipient) can open", async function () {
      const { capsule, creator, recipient, stranger } = await loadFixture(deployFixture);
      const unlockBlock = (await ethers.provider.getBlockNumber()) + 10;

      await capsule.connect(creator).createCapsule("QmHash", unlockBlock, false, recipient.address, { value: 0 });

      for (let i = 0; i < 10; i++) {
        await ethers.provider.send("evm_mine", []);
      }

      // Stranger cannot open
      await expect(capsule.connect(stranger).openCapsule(1)).to.be.revertedWithCustomError(
        capsule,
        "NotAuthorized"
      );

      // Recipient can open
      await expect(capsule.connect(recipient).openCapsule(1)).to.emit(capsule, "CapsuleOpened");
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
