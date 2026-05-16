
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { OptionsJS } from "../poc/blackscholes/optionsJS.mjs";
import { SEC_IN_DAY, tokens } from "./Common.test.mjs";

function binaryCallWrapped(spot, strike, timeSec, vol, rate) {
  if (timeSec <= 0) {
    return spot > strike ? 1 : 0;
  }
  return new OptionsJS().binaryCallPrice(spot, strike, timeSec, vol, rate);
}

function binaryPutWrapped(spot, strike, timeSec, vol, rate) {
  if (timeSec <= 0) {
    return strike > spot ? 1 : 0;
  }
  return new OptionsJS().binaryPutPrice(spot, strike, timeSec, vol, rate);
}

describe("DeFiMathBinary", function () {
  async function deployCompare() {
    const BinaryWrapper = await ethers.getContractFactory("BinaryWrapper");
    const binary = await BinaryWrapper.deploy();

    // Haptic's BlackScholes has public functions, so it must be deployed and linked
    const BlackScholes = await ethers.getContractFactory("contracts/adapters/derivatives/binary/haptic/BlackScholes.sol:BlackScholes");
    const blackScholes = await BlackScholes.deploy();

    const AdapterHaptic = await ethers.getContractFactory("AdapterHaptic", {
      libraries: { "contracts/adapters/derivatives/binary/haptic/BlackScholes.sol:BlackScholes": await blackScholes.getAddress() },
    });
    const adapterHaptic = await AdapterHaptic.deploy();

    return { binary, adapterHaptic };
  }

  describe("compare", function () {
    it("call", async function () {
      const { binary, adapterHaptic } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0, maxError2 = 0;
      let avgGas1 = 0, avgGas2 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = binaryCallWrapped(1000, strike, time * SEC_IN_DAY, vol, rate);

              const result1 = await binary.binaryCallPriceMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.price.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              const result2 = await adapterHaptic.callPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price2 = result2.price.toString() / 1e18;
              avgGas2 += parseInt(result2.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              maxError2 = Math.max(maxError2, Math.abs(price2 - expected));
            }
          }
        }
      }
      console.log("Metric         DeFiMath  Haptic");
      console.log("Max abs error  ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1));
      console.log("Avg gas           ", (avgGas1 / count).toFixed(0), "    " + (avgGas2 / count).toFixed(0));
    });

    it("put", async function () {
      const { binary, adapterHaptic } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0, maxError2 = 0;
      let avgGas1 = 0, avgGas2 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = binaryPutWrapped(1000, strike, time * SEC_IN_DAY, vol, rate);

              const result1 = await binary.binaryPutPriceMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.price.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              const result2 = await adapterHaptic.putPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price2 = result2.price.toString() / 1e18;
              avgGas2 += parseInt(result2.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              maxError2 = Math.max(maxError2, Math.abs(price2 - expected));
            }
          }
        }
      }
      console.log("Metric         DeFiMath  Haptic");
      console.log("Max abs error  ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1));
      console.log("Avg gas           ", (avgGas1 / count).toFixed(0), "    " + (avgGas2 / count).toFixed(0));
    });

    // Binary greeks — Haptic does not implement them, DeFiMath-only.
    const greekGrid = {
      strikes: [800, 900, 1000.01, 1100, 1200],
      times: [7, 30, 60, 90, 180],
      vols: [0.4, 0.6, 0.8],
      rates: [0.05, 0.1, 0.2],
    };

    async function benchGreek(label, contractFn, jsRef, callKey, putKey) {
      let maxError = 0, avgGas = 0, count = 0;
      const optionsJS = new OptionsJS();
      for (const strike of greekGrid.strikes) {
        for (const time of greekGrid.times) {
          for (const vol of greekGrid.vols) {
            for (const rate of greekGrid.rates) {
              const exp = jsRef.call(optionsJS, 1000, strike, time * SEC_IN_DAY, vol, rate);
              const r = await contractFn(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const actCall = Number(BigInt(r[0].toString())) / 1e18;
              const actPut = Number(BigInt(r[1].toString())) / 1e18;
              avgGas += parseInt(r.gasUsed);
              count++;
              maxError = Math.max(maxError, Math.abs(actCall - exp[callKey]), Math.abs(actPut - exp[putKey]));
            }
          }
        }
      }
      console.log("Metric         DeFiMath  Haptic");
      console.log("Max abs error  ", maxError.toExponential(1), "       —");
      console.log("Avg gas           ", (avgGas / count).toFixed(0), "       —");
    }

    it("delta", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek("delta", binary.binaryDeltaMG.bind(binary), OptionsJS.prototype.binaryDelta, "deltaCall", "deltaPut");
    });

    it("gamma", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek("gamma", binary.binaryGammaMG.bind(binary), OptionsJS.prototype.binaryGamma, "gammaCall", "gammaPut");
    });

    it("theta", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek("theta", binary.binaryThetaMG.bind(binary), OptionsJS.prototype.binaryTheta, "thetaCall", "thetaPut");
    });

    it("vega", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek("vega", binary.binaryVegaMG.bind(binary), OptionsJS.prototype.binaryVega, "vegaCall", "vegaPut");
    });
  });
});
