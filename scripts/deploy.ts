import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  console.log("Deploying ChainCapsule...");

  const ChainCapsule = await ethers.getContractFactory("ChainCapsule");
  const capsule = await ChainCapsule.deploy();

  await capsule.waitForDeployment();

  const address = await capsule.getAddress();
  console.log(`ChainCapsule deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
