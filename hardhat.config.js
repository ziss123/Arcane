require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    arcTestnet: {
      url: "https://arc-testnet.drpc.org",
      chainId: 5042002,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};