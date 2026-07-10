require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.36",
    settings: {
      evmVersion: "osaka",
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 4_294_967_295, // uint32 max — Hardhat's current ceiling (solc 0.8.36+ accepts up to uint64 max)
      },
    },
  },
  mocha: {
    timeout: 90000000000
  },
  networks: {
    hardhat: {
      blockGasLimit: 1000000000000
    },
  }
};
