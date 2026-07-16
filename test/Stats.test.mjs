
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import * as ss from "simple-statistics";
import { tokens } from "./Common.test.mjs";

const SEC_PER_DAY = 86400;
const SEC_PER_YEAR = 31536000;

// JS reference implementations
function jsMean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function jsStdDev(arr) {
  const m = jsMean(arr);
  const sumSq = arr.reduce((acc, x) => acc + (x - m) ** 2, 0);
  return Math.sqrt(sumSq / (arr.length - 1));
}
function jsWeightedAverage(values, weights) {
  let sumProducts = 0, sumWeights = 0;
  for (let i = 0; i < values.length; i++) {
    sumProducts += values[i] * weights[i];
    sumWeights += weights[i];
  }
  return sumProducts / sumWeights;
}
function jsLogReturns(prices) {
  const r = [];
  for (let i = 1; i < prices.length; i++) r.push(Math.log(prices[i] / prices[i - 1]));
  return r;
}
function jsHistoricalVolatility(prices, intervalSec) {
  const returns = jsLogReturns(prices);
  const n = returns.length;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / (n - 1);
  return Math.sqrt(variance) * Math.sqrt(SEC_PER_YEAR / intervalSec);
}
function jsSharpeRatio(prices, intervalSec, rfAnnual) {
  const returns = jsLogReturns(prices);
  const n = returns.length;
  const periodMean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((acc, r) => acc + (r - periodMean) ** 2, 0) / (n - 1);
  const periodStdDev = Math.sqrt(variance);
  const factor = SEC_PER_YEAR / intervalSec;
  return (periodMean * factor - rfAnnual) / (periodStdDev * Math.sqrt(factor));
}
function jsMaxDrawdown(equity) {
  let peak = equity[0], maxDD = 0;
  for (let i = 1; i < equity.length; i++) {
    if (equity[i] > peak) peak = equity[i];
    else {
      const dd = (peak - equity[i]) / peak;
      if (dd > maxDD) maxDD = dd;
    }
  }
  return maxDD;
}
function jsValueAtRisk(prices, confidence) {
  return ss.quantile(jsLogReturns(prices), 1 - confidence);
}
function jsConditionalValueAtRisk(prices, confidence) {
  const sorted = jsLogReturns(prices).slice().sort((a, b) => a - b);
  const n = sorted.length;
  let k = Math.floor((1 - confidence) * (n - 1));
  if (k >= n) k = n - 1;
  let sum = 0;
  for (let i = 0; i <= k; i++) sum += sorted[i];
  return sum / (k + 1);
}

const seriesGen = (n, fn) => Array.from({ length: n }, (_, i) => fn(i));

describe("DeFiMathStats", function () {
  async function deployCompare() {
    const StatsWrapper = await ethers.getContractFactory("StatsWrapper");
    const stats = await StatsWrapper.deploy();
    return { stats };
  }

  // No competing on-chain statistics libraries; DeFiMath-only measurements.
  describe("compare", function () {
    const relErr = (a, e) => Math.abs(e) < 1e-300 ? Math.abs(a) : Math.abs((a - e) / e);

    // All array inputs sized to 30 elements so gas figures are directly
    // comparable (matches defimath's "@ 30 prices" reference convention).
    const N = 30;
    const priceSeries = [
      seriesGen(N, i => 100 + 2 * Math.cos(i * 0.3)),
      seriesGen(N, i => 100 + 5 * Math.sin(i * 0.7) + i * 0.1),
      seriesGen(N, i => 100 + 3 * Math.cos(i * 0.4) - i * 0.05),
      seriesGen(N, i => 100 + 10 * Math.sin(i * 0.2)),
      seriesGen(N, i => 100 + 5 * Math.cos(i * 0.3)),
      seriesGen(N, i => 100 + 8 * Math.sin(i * 0.15) + i * 0.2),
    ];

    function report(maxError, avgGas, count) {
      console.log("Metric            DeFiMath");
      console.log("Max rel error     ", maxError.toExponential(1));
      console.log("Avg gas               ", (avgGas / count).toFixed(0));
    }

    it("geometricMean", async function () {
      const { stats } = await loadFixture(deployCompare);
      const pairs = [[1, 4], [0.5, 2], [100, 1000], [1e-6, 1e-2], [1e6, 1e9],
                     [3, 27], [50, 200], [0.1, 10], [1, 1e12], [123.456, 789.012]];
      let maxError = 0, avgGas = 0, count = 0;
      for (const [a, b] of pairs) {
        const expected = Math.sqrt(a * b);
        const res = await stats.geometricMeanMG(tokens(a), tokens(b));
        const y = Number(BigInt(res.result.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      report(maxError, avgGas, count);
    });

    it("mean", async function () {
      const { stats } = await loadFixture(deployCompare);
      const arrays = [
        seriesGen(N, i => 1 + i * 0.5),
        seriesGen(N, i => 100 + i * 0.123),
        seriesGen(N, i => 1 + i * 0.5 + Math.cos(i)),
        seriesGen(N, i => 0.1 + i * 0.7),
      ];
      let maxError = 0, avgGas = 0, count = 0;
      for (const arr of arrays) {
        const expected = jsMean(arr);
        const res = await stats.meanMG(arr.map(v => tokens(v)));
        const y = Number(BigInt(res.result.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      report(maxError, avgGas, count);
    });

    it("stdDev", async function () {
      const { stats } = await loadFixture(deployCompare);
      const arrays = [
        seriesGen(N, i => 100 + 3 * Math.cos(i * 0.4)),
        seriesGen(N, i => 1 + i * 0.5),
        seriesGen(N, i => 50 + 10 * Math.sin(i * 0.2)),
        seriesGen(N, i => 2 + (i % 7)),
      ];
      let maxError = 0, avgGas = 0, count = 0;
      for (const arr of arrays) {
        const expected = jsStdDev(arr);
        const res = await stats.stdDevMG(arr.map(v => tokens(v)));
        const y = Number(BigInt(res.result.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      report(maxError, avgGas, count);
    });

    it("weightedAverage", async function () {
      const { stats } = await loadFixture(deployCompare);
      const cases = [
        [seriesGen(N, i => 10 + i), seriesGen(N, () => 1)],
        [seriesGen(N, i => 100 + i * 2), seriesGen(N, i => 1 + (i % 3))],
        [seriesGen(N, i => 1 + i * 0.5), seriesGen(N, i => 1 + (i % 5))],
        [seriesGen(N, i => 100 + Math.cos(i)), seriesGen(N, i => 1 + Math.abs(Math.sin(i)))],
      ];
      let maxError = 0, avgGas = 0, count = 0;
      for (const [vals, wts] of cases) {
        const expected = jsWeightedAverage(vals, wts);
        const res = await stats.weightedAverageMG(vals.map(v => tokens(v)), wts.map(w => tokens(w)));
        const y = Number(BigInt(res.result.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      report(maxError, avgGas, count);
    });

    it("historicalVolatility", async function () {
      const { stats } = await loadFixture(deployCompare);
      const intervals = [SEC_PER_DAY, 3600, SEC_PER_YEAR];
      let maxError = 0, avgGas = 0, count = 0;
      for (const prices of priceSeries) {
        for (const intv of intervals) {
          const expected = jsHistoricalVolatility(prices, intv);
          if (Math.abs(expected) < 1e-15) continue;
          const res = await stats.historicalVolatilityMG(prices.map(p => tokens(p)), intv);
          const y = Number(BigInt(res.result.toString())) / 1e18;
          avgGas += parseInt(res.gasUsed);
          count++;
          maxError = Math.max(maxError, relErr(y, expected));
        }
      }
      report(maxError, avgGas, count);
    });

    it("sharpeRatio", async function () {
      const { stats } = await loadFixture(deployCompare);
      const rfRates = [0, 0.01, 0.04, 0.05, 0.1];
      let maxError = 0, avgGas = 0, count = 0;
      for (const prices of priceSeries) {
        for (const rf of rfRates) {
          const expected = jsSharpeRatio(prices, SEC_PER_DAY, rf);
          if (Math.abs(expected) < 1e-12 || !isFinite(expected)) continue;
          const rfTok = rf === 0 ? 0 : tokens(rf);
          const res = await stats.sharpeRatioMG(prices.map(p => tokens(p)), SEC_PER_DAY, rfTok);
          const y = Number(BigInt(res.result.toString())) / 1e18;
          avgGas += parseInt(res.gasUsed);
          count++;
          maxError = Math.max(maxError, relErr(y, expected));
        }
      }
      report(maxError, avgGas, count);
    });

    it("maxDrawdown", async function () {
      const { stats } = await loadFixture(deployCompare);
      const cases = [
        seriesGen(N, i => 100 + 10 * Math.cos(i * 0.2) + i * 0.3),
        seriesGen(N, i => 100 + 20 * Math.sin(i * 0.15) - i * 0.1),
        seriesGen(N, i => 100 - i * 2),
        seriesGen(N, i => 100 + 15 * Math.cos(i * 0.5)),
      ];
      let maxError = 0, avgGas = 0, count = 0;
      for (const equity of cases) {
        const expected = jsMaxDrawdown(equity);
        if (Math.abs(expected) < 1e-15) continue;
        const res = await stats.maxDrawdownMG(equity.map(v => tokens(v)));
        const y = Number(BigInt(res.result.toString())) / 1e18;
        avgGas += parseInt(res.gasUsed);
        count++;
        maxError = Math.max(maxError, relErr(y, expected));
      }
      report(maxError, avgGas, count);
    });

    it("valueAtRisk", async function () {
      const { stats } = await loadFixture(deployCompare);
      const confidences = [0.9, 0.95, 0.975, 0.99];
      let maxError = 0, avgGas = 0, count = 0;
      for (const prices of priceSeries) {
        for (const c of confidences) {
          const expected = jsValueAtRisk(prices, c);
          if (Math.abs(expected) < 1e-15) continue;
          const res = await stats.valueAtRiskMG(prices.map(p => tokens(p)), tokens(c));
          const y = Number(BigInt(res.result.toString())) / 1e18;
          avgGas += parseInt(res.gasUsed);
          count++;
          maxError = Math.max(maxError, relErr(y, expected));
        }
      }
      report(maxError, avgGas, count);
    });

    it("conditionalValueAtRisk", async function () {
      const { stats } = await loadFixture(deployCompare);
      const confidences = [0.9, 0.95, 0.975, 0.99];
      let maxError = 0, avgGas = 0, count = 0;
      for (const prices of priceSeries) {
        for (const c of confidences) {
          const expected = jsConditionalValueAtRisk(prices, c);
          if (Math.abs(expected) < 1e-15) continue;
          const res = await stats.conditionalValueAtRiskMG(prices.map(p => tokens(p)), tokens(c));
          const y = Number(BigInt(res.result.toString())) / 1e18;
          avgGas += parseInt(res.gasUsed);
          count++;
          maxError = Math.max(maxError, relErr(y, expected));
        }
      }
      report(maxError, avgGas, count);
    });
  });
});
