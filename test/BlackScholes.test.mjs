
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import bs from "black-scholes";
import greeks from "greeks";
import { tokens, SEC_IN_DAY, printMetrics, e1, relOrDash, avg } from "./Common.test.mjs";
import { AVG_GAS_CALL, AVG_GAS_PUT, AVG_GAS_DELTA, AVG_GAS_GAMMA, AVG_GAS_THETA, AVG_GAS_VEGA } from "defimath-lib/constants/Constants.mjs";

// bs has a bug with time = 0, it returns NaN, so we are wrapping it
function blackScholesWrapped(spot, strike, time, vol, rate, callOrPut) {
  if (time <= 0) {
    if (callOrPut === "call") {
      return Math.max(0, spot - strike);
    } else {
      return Math.max(0, strike - spot);
    }
  }

  vol += 1e-16;

  return Math.max(0, bs.blackScholes(spot, strike, time, vol, rate, callOrPut));
}

describe("BlackScholes", function () {
  async function deployCompare() {
    const BlackScholesWrapper = await ethers.getContractFactory("BlackScholesWrapper");
    const options = await BlackScholesWrapper.deploy();

    const AdapterDerivexyz = await ethers.getContractFactory("AdapterDerivexyz");
    const adapterDerivexyz = await AdapterDerivexyz.deploy();

    const AdapterPremia = await ethers.getContractFactory("AdapterPremia");
    const adapterPremia = await AdapterPremia.deploy();

    const AdapterParty = await ethers.getContractFactory("AdapterParty");
    const adapterParty = await AdapterParty.deploy();

    const AdapterDopex = await ethers.getContractFactory("AdapterDopex");
    const adapterDopex = await AdapterDopex.deploy();

    return { options, adapterDerivexyz, adapterPremia, adapterParty, adapterDopex };
  }

  describe("compare", function () {
    it("call", async function () {
      const { options, adapterDerivexyz, adapterPremia, adapterParty, adapterDopex } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0, maxError2 = 0, maxError3 = 0, maxError4 = 0;
      let maxRel1 = 0, maxRel2 = 0, maxRel3 = 0, maxRel4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0, avgGas5 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = blackScholesWrapped(1000, strike, time / 365, vol, rate, "call");

              const result1 = await options.callMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.price.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              const result2 = await adapterDerivexyz.callPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price2 = result2.price.toString() / 1e18;
              avgGas2 += parseInt(result2.gasUsed);

              // Premia: discounted strike instead of rate, vol squared (uses variance)
              const result3 = await adapterPremia.callPrice(tokens(1000), tokens(strike / Math.exp(rate * time / 365)), time * SEC_IN_DAY, tokens(vol ** 2));
              const price3 = result3.price.toString() / 1e18;
              avgGas3 += parseInt(result3.gasUsed);

              const result4 = await adapterParty.callPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price4 = result4.price.toString() / 1e18;
              avgGas4 += parseInt(result4.gasUsed);

              const result5 = await adapterDopex.callPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price5 = result5.price.toString() / 1e18;
              avgGas5 += parseInt(result5.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              maxError2 = Math.max(maxError2, Math.abs(price2 - expected));
              maxError3 = Math.max(maxError3, Math.abs(price3 - expected));
              maxError4 = Math.max(maxError4, Math.abs(price4 - expected));
              // prices are >= 1 across this strike range → relative error is the meaningful metric
              if (Math.abs(expected) >= 1) {
                maxRel1 = Math.max(maxRel1, Math.abs(price1 - expected) / Math.abs(expected));
                maxRel2 = Math.max(maxRel2, Math.abs(price2 - expected) / Math.abs(expected));
                maxRel3 = Math.max(maxRel3, Math.abs(price3 - expected) / Math.abs(expected));
                maxRel4 = Math.max(maxRel4, Math.abs(price4 - expected) / Math.abs(expected));
              }
            }
          }
        }
      }
      printMetrics(
        ["Metric", "DeFiMath", "Derivexyz", "Premia", "Party1983", "Dopex"],
        [
          ["Max abs error", e1(maxError1), e1(maxError2), e1(maxError3), e1(maxError4), "—"],
          ["Max rel error", e1(maxRel1), e1(maxRel2), e1(maxRel3), e1(maxRel4), "—"],
          ["Avg gas", avg(avgGas1, count), avg(avgGas2, count), avg(avgGas3, count), avg(avgGas4, count), avg(avgGas5, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_CALL, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_CALL (${AVG_GAS_CALL})`);
    });

    it("put", async function () {
      const { options, adapterDerivexyz, adapterPremia, adapterParty, adapterDopex } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0, maxError2 = 0, maxError3 = 0, maxError4 = 0;
      let maxRel1 = 0, maxRel2 = 0, maxRel3 = 0, maxRel4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0, avgGas5 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = blackScholesWrapped(1000, strike, time / 365, vol, rate, "put");

              const result1 = await options.putMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.price.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              const result2 = await adapterDerivexyz.putPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price2 = result2.price.toString() / 1e18;
              avgGas2 += parseInt(result2.gasUsed);

              const result3 = await adapterPremia.putPrice(tokens(1000), tokens(strike / Math.exp(rate * time / 365)), time * SEC_IN_DAY, tokens(vol ** 2));
              const price3 = result3.price.toString() / 1e18;
              avgGas3 += parseInt(result3.gasUsed);

              const result4 = await adapterParty.putPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price4 = result4.price.toString() / 1e18;
              avgGas4 += parseInt(result4.gasUsed);

              const result5 = await adapterDopex.putPrice(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price5 = result5.price.toString() / 1e18;
              avgGas5 += parseInt(result5.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              maxError2 = Math.max(maxError2, Math.abs(price2 - expected));
              maxError3 = Math.max(maxError3, Math.abs(price3 - expected));
              maxError4 = Math.max(maxError4, Math.abs(price4 - expected));
              // prices are >= 1 across this strike range → relative error is the meaningful metric
              if (Math.abs(expected) >= 1) {
                maxRel1 = Math.max(maxRel1, Math.abs(price1 - expected) / Math.abs(expected));
                maxRel2 = Math.max(maxRel2, Math.abs(price2 - expected) / Math.abs(expected));
                maxRel3 = Math.max(maxRel3, Math.abs(price3 - expected) / Math.abs(expected));
                maxRel4 = Math.max(maxRel4, Math.abs(price4 - expected) / Math.abs(expected));
              }
            }
          }
        }
      }
      printMetrics(
        ["Metric", "DeFiMath", "Derivexyz", "Premia", "Party1983", "Dopex"],
        [
          ["Max abs error", e1(maxError1), e1(maxError2), e1(maxError3), e1(maxError4), "—"],
          ["Max rel error", e1(maxRel1), e1(maxRel2), e1(maxRel3), e1(maxRel4), "—"],
          ["Avg gas", avg(avgGas1, count), avg(avgGas2, count), avg(avgGas3, count), avg(avgGas4, count), avg(avgGas5, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_PUT, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_PUT (${AVG_GAS_PUT})`);
    });

    it("delta", async function () {
      const { options, adapterDerivexyz, adapterParty } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0, maxError2 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas4 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = greeks.getDelta(1000, strike, time / 365, vol, rate, "call");

              const result1 = await options.deltaMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.deltaCall.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              const result2 = await adapterDerivexyz.delta(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price2 = result2.deltaCall.toString() / 1e18;
              avgGas2 += parseInt(result2.gasUsed);

              const result4 = await adapterParty.delta(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price4 = result4.deltaCall.toString() / 1e18;
              avgGas4 += parseInt(result4.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              maxError2 = Math.max(maxError2, Math.abs(price2 - expected));
              maxError4 = Math.max(maxError4, Math.abs(price4 - expected));
            }
          }
        }
      }
      printMetrics(
        ["Metric", "DeFiMath", "Derivexyz", "Party1983"],
        [
          ["Max abs error", e1(maxError1), e1(maxError2), e1(maxError4)],
          ["Avg gas", avg(avgGas1, count), avg(avgGas2, count), avg(avgGas4, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_DELTA, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_DELTA (${AVG_GAS_DELTA})`);
    });

    it("gamma", async function () {
      const { options } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0;
      let avgGas1 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = greeks.getGamma(1000, strike, time / 365, vol, rate, "call");

              const result1 = await options.gammaMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.gammaOut.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
            }
          }
        }
      }
      printMetrics(
        ["Metric", "DeFiMath"],
        [
          ["Max abs error", e1(maxError1)],
          ["Avg gas", avg(avgGas1, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_GAMMA, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_GAMMA (${AVG_GAS_GAMMA})`);
    });

    it("theta", async function () {
      const { options } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0;
      let maxRel1 = 0;
      let avgGas1 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = greeks.getTheta(1000, strike, time / 365, vol, rate, "call");

              const result1 = await options.thetaMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.thetaCall.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              // |theta| exceeds 1 for longer-dated options → relative error applies there
              if (Math.abs(expected) >= 1) maxRel1 = Math.max(maxRel1, Math.abs(price1 - expected) / Math.abs(expected));
            }
          }
        }
      }
      printMetrics(
        ["Metric", "DeFiMath"],
        [
          ["Max abs error", e1(maxError1)],
          ["Max rel error", relOrDash(maxRel1)],
          ["Avg gas", avg(avgGas1, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_THETA, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_THETA (${AVG_GAS_THETA})`);
    });

    it("vega", async function () {
      const { options, adapterDerivexyz } = await loadFixture(deployCompare);

      const strikes = [800, 900, 1000.01, 1100, 1200];
      const times = [7, 30, 60, 90, 180];
      const vols = [0.4, 0.6, 0.8];
      const rates = [0.05, 0.1, 0.2];

      let maxError1 = 0, maxError2 = 0;
      let maxRel1 = 0, maxRel2 = 0;
      let avgGas1 = 0, avgGas2 = 0;
      let count = 0;

      for (const strike of strikes) {
        for (const time of times) {
          for (const vol of vols) {
            for (const rate of rates) {
              const expected = greeks.getVega(1000, strike, time / 365, vol, rate, "call");

              const result1 = await options.vegaMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price1 = result1.vegaOut.toString() / 1e18;
              avgGas1 += parseInt(result1.gasUsed);

              const result2 = await adapterDerivexyz.vega(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
              const price2 = result2._vega.toString() / 1e18;
              avgGas2 += parseInt(result2.gasUsed);

              count++;
              maxError1 = Math.max(maxError1, Math.abs(price1 - expected));
              maxError2 = Math.max(maxError2, Math.abs(price2 - expected));
              // vega exceeds 1 for longer-dated options → relative error applies there
              if (Math.abs(expected) >= 1) {
                maxRel1 = Math.max(maxRel1, Math.abs(price1 - expected) / Math.abs(expected));
                maxRel2 = Math.max(maxRel2, Math.abs(price2 - expected) / Math.abs(expected));
              }
            }
          }
        }
      }
      printMetrics(
        ["Metric", "DeFiMath", "Derivexyz"],
        [
          ["Max abs error", e1(maxError1), e1(maxError2)],
          ["Max rel error", relOrDash(maxRel1), relOrDash(maxRel2)],
          ["Avg gas", avg(avgGas1, count), avg(avgGas2, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_VEGA, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_VEGA (${AVG_GAS_VEGA})`);
    });
  });
});
