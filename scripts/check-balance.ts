import hre from "hardhat";

async function main() {
  const { ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "BNB");
  console.log("Network:", hre.network.name, "Chain ID:", hre.network.config.chainId);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
