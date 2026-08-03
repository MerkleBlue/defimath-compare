
import { assert } from "chai";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import erf from "math-erf";
import { tokens, SEC_IN_DAY, printMetrics, e1, avg } from "./Common.test.mjs";
import { AVG_GAS_BINARY_CALL, AVG_GAS_BINARY_PUT, AVG_GAS_BINARY_DELTA, AVG_GAS_BINARY_GAMMA, AVG_GAS_BINARY_THETA, AVG_GAS_BINARY_VEGA } from "defimath-lib/constants/Constants.mjs";

// True-math binary (cash-or-nothing) Black-Scholes reference.
//
// This is an INDEPENDENT oracle: it uses Math.log / Math.exp / Math.sqrt and the
// math-erf package (the same erf reference the Math suite validates against).
// It does NOT reuse any DeFiMath algorithm — so precision measured against it is
// true mathematical error, not self-consistency with the Solidity implementation.
//
// Conventions match DeFiMath: unit payout, theta per day, vega per 1% vol move.
const SECONDS_IN_YEAR = 31536000;

const normCDF = (x) => 0.5 * (1 + erf(x / Math.SQRT2));
const normPDF = (x) => Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI);

function binaryRef(spot, strike, timeSec, vol, rate) {
  const timeYear = timeSec / SECONDS_IN_YEAR;
  const scaledVol = vol * Math.sqrt(timeYear) + 1e-16;   // + 1e-16 to avoid division by zero
  const scaledRate = rate * timeYear;

  const d1 = (scaledRate + scaledVol * scaledVol / 2 - Math.log(strike / spot)) / scaledVol;
  const d2 = d1 - scaledVol;
  const discount = Math.exp(-scaledRate);                // e^(-r·τ)
  const phi = normPDF(d2);                               // φ(d2)

  const deltaCall = discount * phi / (spot * scaledVol);
  const gammaCall = -discount * phi * d1 / (spot * spot * scaledVol * scaledVol);
  const term = discount * phi * (d1 / (2 * timeYear) - rate / scaledVol);
  const vegaCall = -discount * phi * d1 / vol / 100;

  return {
    callPrice: discount * normCDF(d2),
    putPrice: discount * normCDF(-d2),
    deltaCall, deltaPut: -deltaCall,
    gammaCall, gammaPut: -gammaCall,
    thetaCall: (rate * discount * normCDF(d2) + term) / 365,
    thetaPut: (rate * discount * normCDF(-d2) - term) / 365,
    vegaCall, vegaPut: -vegaCall,
  };
}

function binaryCallWrapped(spot, strike, timeSec, vol, rate) {
  if (timeSec <= 0) {
    return spot > strike ? 1 : 0;
  }
  return binaryRef(spot, strike, timeSec, vol, rate).callPrice;
}

function binaryPutWrapped(spot, strike, timeSec, vol, rate) {
  if (timeSec <= 0) {
    return strike > spot ? 1 : 0;
  }
  return binaryRef(spot, strike, timeSec, vol, rate).putPrice;
}

describe("BinaryOptions", function () {
  async function deployCompare() {
    const BinaryOptionsWrapper = await ethers.getContractFactory("BinaryOptionsWrapper");
    const binary = await BinaryOptionsWrapper.deploy();

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

              const result1 = await binary.callMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
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
      printMetrics(
        ["Metric", "DeFiMath", "Haptic"],
        [
          ["Max abs error", e1(maxError1), e1(maxError2)],
          ["Avg gas", avg(avgGas1, count), avg(avgGas2, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_BINARY_CALL, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_BINARY_CALL (${AVG_GAS_BINARY_CALL})`);
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

              const result1 = await binary.putMG(tokens(1000), tokens(strike), time * SEC_IN_DAY, tokens(vol), tokens(rate));
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
      printMetrics(
        ["Metric", "DeFiMath", "Haptic"],
        [
          ["Max abs error", e1(maxError1), e1(maxError2)],
          ["Avg gas", avg(avgGas1, count), avg(avgGas2, count)],
        ]
      );
      assert.equal(Math.round(avgGas1 / count), AVG_GAS_BINARY_PUT, `DeFiMath gas ${Math.round(avgGas1 / count)} ≠ AVG_GAS_BINARY_PUT (${AVG_GAS_BINARY_PUT})`);
    });

    // Binary greeks — Haptic does not implement them, DeFiMath-only.
    const greekGrid = {
      strikes: [800, 900, 1000.01, 1100, 1200],
      times: [7, 30, 60, 90, 180],
      vols: [0.4, 0.6, 0.8],
      rates: [0.05, 0.1, 0.2],
    };

    async function benchGreek(contractFn, callKey, putKey, expectedGas) {
      let maxError = 0, avgGas = 0, count = 0;
      for (const strike of greekGrid.strikes) {
        for (const time of greekGrid.times) {
          for (const vol of greekGrid.vols) {
            for (const rate of greekGrid.rates) {
              const exp = binaryRef(1000, strike, time * SEC_IN_DAY, vol, rate);
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
      printMetrics(
        ["Metric", "DeFiMath", "Haptic"],
        [
          ["Max abs error", e1(maxError), "—"],
          ["Avg gas", avg(avgGas, count), "—"],
        ]
      );
      assert.equal(Math.round(avgGas / count), expectedGas, `DeFiMath gas ${Math.round(avgGas / count)} ≠ expected (${expectedGas})`);
    }

    it("delta", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek(binary.deltaMG.bind(binary), "deltaCall", "deltaPut", AVG_GAS_BINARY_DELTA);
    });

    it("gamma", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek(binary.gammaMG.bind(binary), "gammaCall", "gammaPut", AVG_GAS_BINARY_GAMMA);
    });

    it("theta", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek(binary.thetaMG.bind(binary), "thetaCall", "thetaPut", AVG_GAS_BINARY_THETA);
    });

    it("vega", async function () {
      const { binary } = await loadFixture(deployCompare);
      await benchGreek(binary.vegaMG.bind(binary), "vegaCall", "vegaPut", AVG_GAS_BINARY_VEGA);
    });
  });
});
