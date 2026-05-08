require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.34",
    settings: {
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 10_000_000,
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
