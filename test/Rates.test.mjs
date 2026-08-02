
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import { tokens, SEC_IN_DAY, SEC_IN_YEAR, printMetrics, e1, avg } from "./Common.test.mjs";

// JS reference: continuous-compounding YTM for a zero-coupon bond
function jsYieldToMaturity(price, faceValue, timeToMaturity) {
  return Math.log(faceValue / price) / (timeToMaturity / SEC_IN_YEAR);
}

// JS reference: continuous-compounding IRR via Newton-Raphson
// Mirrors the Solidity implementation: solves Σ Cᵢ · e^(-r·tᵢ) = 0
function jsInternalRateOfReturn(cashflows, times, guess) {
  let r = guess;
  for (let iter = 0; iter < 50; iter++) {
    let f = 0, fp = 0;
    for (let i = 0; i < cashflows.length; i++) {
      const tYear = times[i] / SEC_IN_YEAR;
      const e = Math.exp(-r * tYear);
      f += cashflows[i] * e;
      fp -= cashflows[i] * tYear * e;
    }
    if (Math.abs(f) < 1e-8) return r;
    r -= f / fp;
  }
  throw new Error("No convergence");
}

describe("Rates", function () {
  async function deployCompare() {
    const RatesWrapper = await ethers.getContractFactory("RatesWrapper");
    const rates = await RatesWrapper.deploy();
    return { rates };
  }

  // No competing on-chain interest-rate libraries; DeFiMath-only measurements.
  describe("compare", function () {
    const relErr = (a, e) => Math.abs(e) < 1e-300 ? Math.abs(a) : Math.abs((a - e) / e);

    it("compoundInterest", async function () {
      const { rates } = await loadFixture(deployCompare);
      const principals = [1, 100, 1000, 1e6, 1e10];
      const ratesArr = [0.001, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 4];
      const times = [SEC_IN_DAY, SEC_IN_DAY * 7, SEC_IN_DAY * 30, SEC_IN_YEAR, SEC_IN_YEAR * 2];

      let maxError = 0, avgGas = 0, count = 0;
      for (const p of principals) {
        for (const r of ratesArr) {
          for (const t of times) {
            const expected = p * Math.exp(r * t / SEC_IN_YEAR);
            const res = await rates.compoundInterestMG(tokens(p), tokens(r), t);
            const y = Number(BigInt(res.amount.toString())) / 1e18;
            avgGas += parseInt(res.gasUsed);
            count++;
            maxError = Math.max(maxError, relErr(y, expected));
          }
        }
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });

    it("presentValue", async function () {
      const { rates } = await loadFixture(deployCompare);
      const fvs = [1, 100, 1000, 1e6, 1e10];
      const ratesArr = [0.001, 0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 4];
      const times = [SEC_IN_DAY, SEC_IN_DAY * 7, SEC_IN_DAY * 30, SEC_IN_YEAR, SEC_IN_YEAR * 2];

      let maxError = 0, avgGas = 0, count = 0;
      for (const fv of fvs) {
        for (const r of ratesArr) {
          for (const t of times) {
            const expected = fv * Math.exp(-r * t / SEC_IN_YEAR);
            const res = await rates.presentValueMG(tokens(fv), tokens(r), t);
            const y = Number(BigInt(res.amount.toString())) / 1e18;
            avgGas += parseInt(res.gasUsed);
            count++;
            maxError = Math.max(maxError, relErr(y, expected));
          }
        }
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });

    it("logReturn", async function () {
      const { rates } = await loadFixture(deployCompare);
      const oldPrices = [1, 100, 1000, 1e6];

      let maxError = 0, avgGas = 0, count = 0;
      for (const oldP of oldPrices) {
        for (let ratio = 0.01; ratio <= 100; ratio *= 1.3) {
          const newP = oldP * ratio;
          const expected = Math.log(newP / oldP);
          if (Math.abs(expected) < 1e-12) continue; // skip near-zero (ratio ≈ 1)
          const res = await rates.logReturnMG(tokens(newP), tokens(oldP));
          const y = Number(BigInt(res.y.toString())) / 1e18;
          avgGas += parseInt(res.gasUsed);
          count++;
          maxError = Math.max(maxError, relErr(y, expected));
        }
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });

    it("continuousToDiscrete", async function () {
      const { rates } = await loadFixture(deployCompare);

      let maxError = 0, avgGas = 0, count = 0;
      for (let r = -0.5; r <= 0.5; r += 0.0137) {
        const expected = Math.expm1(r);
        if (Math.abs(expected) < 1e-12) continue;
        const res = await rates.continuousToDiscreteMG(tokens(r));
        const y = Number(BigInt(res.y.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });

    it("discreteToContinuous", async function () {
      const { rates } = await loadFixture(deployCompare);

      let maxError = 0, avgGas = 0, count = 0;
      for (let r = -0.5; r <= 0.5; r += 0.0137) {
        const expected = Math.log1p(r);
        if (Math.abs(expected) < 1e-12) continue;
        const res = await rates.discreteToContinuousMG(tokens(r));
        const y = Number(BigInt(res.y.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });

    it("yieldToMaturity", async function () {
      const { rates } = await loadFixture(deployCompare);
      const faces = [100, 1000, 10000];
      const times = [SEC_IN_DAY * 30, SEC_IN_DAY * 90, SEC_IN_YEAR, SEC_IN_YEAR * 2];
      const discounts = [0.99, 0.95, 0.9, 0.75, 0.5, 0.25, 0.1];

      let maxError = 0, avgGas = 0, count = 0;
      for (const face of faces) {
        for (const t of times) {
          for (const discount of discounts) {
            const price = face * discount;
            const expected = jsYieldToMaturity(price, face, t);
            const res = await rates.yieldToMaturityMG(tokens(price), tokens(face), t);
            const y = Number(BigInt(res.y.toString())) / 1e18;
            avgGas += parseInt(res.gasUsed);
            count++;
            maxError = Math.max(maxError, relErr(y, expected));
          }
        }
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });

    it("internalRateOfReturn", async function () {
      const { rates } = await loadFixture(deployCompare);
      const scenarios = [
        [[-1000, 300, 300, 300, 300], [0, SEC_IN_YEAR, 2 * SEC_IN_YEAR, 3 * SEC_IN_YEAR, 4 * SEC_IN_YEAR], 0.05],
        [[-100, 110], [0, SEC_IN_YEAR], 0.05],
        [[-100, 50, 70], [0, SEC_IN_YEAR, 2 * SEC_IN_YEAR], 0.1],
        [[-1000, 900], [0, SEC_IN_YEAR], -0.05],
        [[-10000, 2000, 3000, 4000, 3000], [0, SEC_IN_YEAR, 2 * SEC_IN_YEAR, 3 * SEC_IN_YEAR, 4 * SEC_IN_YEAR], 0.05],
        [[-5000, 1500, 1500, 1500, 1500], [0, 90 * SEC_IN_DAY, 180 * SEC_IN_DAY, 270 * SEC_IN_DAY, SEC_IN_YEAR], 0.1],
      ];

      let maxError = 0, avgGas = 0, count = 0;
      for (const [cf, t, guess] of scenarios) {
        const expected = jsInternalRateOfReturn(cf, t, guess);
        const res = await rates.internalRateOfReturnMG(cf.map(c => tokens(c)), t, tokens(guess));
        const y = Number(BigInt(res.y.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      printMetrics(["Metric", "DeFiMath"], [["Max rel error", e1(maxError)], ["Avg gas", avg(avgGas, count)]]);
    });
  });
});
