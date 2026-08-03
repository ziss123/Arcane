require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const USDC   = "0x3600000000000000000000000000000000000000";
  const EURC   = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a";
  const cirBTC = "0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF";

  // Deploy ShieldPool
  console.log("Deploying ArcaneShieldPool...");
  const ShieldPool = await ethers.getContractFactory("ArcaneShieldPool");
  const shieldPool = await ShieldPool.deploy();
  await shieldPool.waitForDeployment();
  const shieldPoolAddress = await shieldPool.getAddress();
  console.log("ArcaneShieldPool:", shieldPoolAddress);

  // Deploy Swap
  console.log("Deploying ArcaneSwap...");
  const Swap = await ethers.getContractFactory("ArcaneSwap");
  const swap = await Swap.deploy();
  await swap.waitForDeployment();
  const swapAddress = await swap.getAddress();
  console.log("ArcaneSwap:", swapAddress);

  // Set rates
  console.log("Setting rates...");
  const swapContract = await ethers.getContractAt("ArcaneSwap", swapAddress);

  await swapContract.setRate(USDC, EURC, 1000000n);
  await swapContract.setRate(EURC, USDC, 1000000n);
  await swapContract.setRate(USDC, cirBTC, 13n);
  await swapContract.setRate(cirBTC, USDC, 76923000000n);
  await swapContract.setRate(EURC, cirBTC, 13n);
  await swapContract.setRate(cirBTC, EURC, 76923000000n);

  console.log("All rates set!");

  // Save addresses to .env format
  console.log("\n✅ Add these to your .env:");
  console.log("VITE_SHIELD_POOL_ADDRESS=" + shieldPoolAddress);
  console.log("VITE_SWAP_ADDRESS=" + swapAddress);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});