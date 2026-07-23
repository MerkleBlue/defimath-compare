
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import bs from "black-scholes";
import erf from 'math-erf';
import { tokens, sqrtExactWei, relError } from "./Common.test.mjs";

describe("DeFiMath", function () {
  async function deployCompare() {
    const MathWrapper = await ethers.getContractFactory("MathWrapper");
    const deFiMath = await MathWrapper.deploy();

    const AdapterPRBMath = await ethers.getContractFactory("AdapterPRBMath");
    const prbMath = await AdapterPRBMath.deploy();

    const AdapterABDKMath = await ethers.getContractFactory("AdapterABDKMath");
    const abdkMath = await AdapterABDKMath.deploy();

    const AdapterSolady = await ethers.getContractFactory("AdapterSolady");
    const solady = await AdapterSolady.deploy();

    const AdapterSolStat = await ethers.getContractFactory("AdapterSolStat");
    const solStat = await AdapterSolStat.deploy();

    return { deFiMath, prbMath, abdkMath, solady, solStat };
  }

  describe("compare", function () {
    it("exp", async function () {
      const { deFiMath, prbMath, abdkMath, solady } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0, maxRel3 = 0, maxRel4 = 0;
      let maxAbs1 = 0, maxAbs2 = 0, maxAbs3 = 0, maxAbs4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: 1000 samples, both branches balanced.
      // Rel error tracked where |exp(x)| >= 1 (x >= 0), abs error where |exp(x)| < 1 (x < 0).
      for (let x = -10; x <= 10; x += 0.02) {
        const expected = Math.exp(x);

        const result1 = await deFiMath.expMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await prbMath.expMG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        const result3 = await abdkMath.expMG(tokens(x));
        const y3 = result3.y.toString() / 1e18;
        avgGas3 += parseInt(result3.gasUsed);

        const result4 = await solady.expMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        if (Math.abs(expected) >= 1) {
          maxRel1 = Math.max(maxRel1, Math.abs((y1 - expected) / expected));
          maxRel2 = Math.max(maxRel2, Math.abs((y2 - expected) / expected));
          maxRel3 = Math.max(maxRel3, Math.abs((y3 - expected) / expected));
          maxRel4 = Math.max(maxRel4, Math.abs((y4 - expected) / expected));
        } else {
          maxAbs1 = Math.max(maxAbs1, Math.abs(y1 - expected));
          maxAbs2 = Math.max(maxAbs2, Math.abs(y2 - expected));
          maxAbs3 = Math.max(maxAbs3, Math.abs(y3 - expected));
          maxAbs4 = Math.max(maxAbs4, Math.abs(y4 - expected));
        }
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1) + "  ", (maxRel3).toExponential(1) + "  ", (maxRel4).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1) + "  ", (maxAbs3).toExponential(1) + "  ", (maxAbs4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0), "     " + (avgGas3 / count).toFixed(0), "      " + (avgGas4 / count).toFixed(0));
    });

    it("ln", async function () {
      const { deFiMath, prbMath, abdkMath, solady } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0, maxRel3 = 0, maxRel4 = 0;
      let maxAbs1 = 0, maxAbs2 = 0, maxAbs3 = 0, maxAbs4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: log-symmetric around 1, 1000 samples,
      // both branches balanced. Rel tracked where |ln(x)| >= 1, abs where |ln(x)| < 1
      // (near the root at x = 1 where relative error would blow up).
      for (let x = 1 / 16; x <= 16; x *= 256 ** (1 / 1000)) {
        const expected = Math.log(x);

        const result1 = await deFiMath.lnMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await prbMath.lnMG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        const result3 = await abdkMath.lnMG(tokens(x));
        const y3 = result3.y.toString() / 1e18;
        avgGas3 += parseInt(result3.gasUsed);

        const result4 = await solady.lnMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        if (Math.abs(expected) >= 1) {
          maxRel1 = Math.max(maxRel1, Math.abs((y1 - expected) / expected));
          maxRel2 = Math.max(maxRel2, Math.abs((y2 - expected) / expected));
          maxRel3 = Math.max(maxRel3, Math.abs((y3 - expected) / expected));
          maxRel4 = Math.max(maxRel4, Math.abs((y4 - expected) / expected));
        } else {
          maxAbs1 = Math.max(maxAbs1, Math.abs(y1 - expected));
          maxAbs2 = Math.max(maxAbs2, Math.abs(y2 - expected));
          maxAbs3 = Math.max(maxAbs3, Math.abs(y3 - expected));
          maxAbs4 = Math.max(maxAbs4, Math.abs(y4 - expected));
        }
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1) + "  ", (maxRel3).toExponential(1) + "  ", (maxRel4).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1) + "  ", (maxAbs3).toExponential(1) + "  ", (maxAbs4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0), "    " + (avgGas3 / count).toFixed(0), "      " + (avgGas4 / count).toFixed(0));
    });

    it("log2", async function () {
      const { deFiMath, prbMath, abdkMath } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0, maxRel3 = 0;
      let maxAbs1 = 0, maxAbs2 = 0, maxAbs3 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: log-symmetric around 1, 1000 samples,
      // both branches balanced. Rel tracked where |log2(x)| >= 1, abs where < 1.
      for (let x = 1 / 16; x <= 16; x *= 256 ** (1 / 1000)) {
        const expected = Math.log2(x);

        const result1 = await deFiMath.log2MG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await prbMath.log2MG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        const result3 = await abdkMath.log2MG(tokens(x));
        const y3 = result3.y.toString() / 1e18;
        avgGas3 += parseInt(result3.gasUsed);

        count++;
        if (Math.abs(expected) >= 1) {
          maxRel1 = Math.max(maxRel1, Math.abs((y1 - expected) / expected));
          maxRel2 = Math.max(maxRel2, Math.abs((y2 - expected) / expected));
          maxRel3 = Math.max(maxRel3, Math.abs((y3 - expected) / expected));
        } else {
          maxAbs1 = Math.max(maxAbs1, Math.abs(y1 - expected));
          maxAbs2 = Math.max(maxAbs2, Math.abs(y2 - expected));
          maxAbs3 = Math.max(maxAbs3, Math.abs(y3 - expected));
        }
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1) + "  ", (maxRel3).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1) + "  ", (maxAbs3).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0), "    " + (avgGas3 / count).toFixed(0));
    });

    it("log10", async function () {
      const { deFiMath, prbMath } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0;
      let maxAbs1 = 0, maxAbs2 = 0;
      let avgGas1 = 0, avgGas2 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: log-symmetric around 1, 1000 samples,
      // both branches balanced. Rel tracked where |log10(x)| >= 1, abs where < 1.
      for (let x = 1 / 16; x <= 16; x *= 256 ** (1 / 1000)) {
        const expected = Math.log10(x);

        const result1 = await deFiMath.log10MG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await prbMath.log10MG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        count++;
        if (Math.abs(expected) >= 1) {
          maxRel1 = Math.max(maxRel1, Math.abs((y1 - expected) / expected));
          maxRel2 = Math.max(maxRel2, Math.abs((y2 - expected) / expected));
        } else {
          maxAbs1 = Math.max(maxAbs1, Math.abs(y1 - expected));
          maxAbs2 = Math.max(maxAbs2, Math.abs(y2 - expected));
        }
      }
      console.log("Metric            DeFiMath   PRBMath");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0));
    });

    it("pow", async function () {
      const { deFiMath, prbMath, solady } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0, maxRel4 = 0;
      let maxAbs1 = 0, maxAbs2 = 0, maxAbs4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas4 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: 32 log-x × 32 linear a = 1024 samples.
      // x covers both ln branches, a covers both exp signs. Rel tracked where
      // |x^a| >= 1, abs where < 1.
      const xRatio = 256 ** (1 / 31);
      for (let x = 1 / 16; x <= 16; x *= xRatio) {
        for (let a = -3; a <= 3; a += 6 / 31) {
          const expected = Math.pow(x, a);

          const result1 = await deFiMath.powMG(tokens(x), tokens(a));
          const y1 = result1.y.toString() / 1e18;
          avgGas1 += parseInt(result1.gasUsed);

          const result2 = await prbMath.powMG(tokens(x), tokens(a));
          const y2 = result2.y.toString() / 1e18;
          avgGas2 += parseInt(result2.gasUsed);

          const result4 = await solady.powMG(tokens(x), tokens(a));
          const y4 = result4.y.toString() / 1e18;
          avgGas4 += parseInt(result4.gasUsed);

          count++;
          if (Math.abs(expected) >= 1) {
            maxRel1 = Math.max(maxRel1, Math.abs((y1 - expected) / expected));
            maxRel2 = Math.max(maxRel2, Math.abs((y2 - expected) / expected));
            maxRel4 = Math.max(maxRel4, Math.abs((y4 - expected) / expected));
          } else {
            maxAbs1 = Math.max(maxAbs1, Math.abs(y1 - expected));
            maxAbs2 = Math.max(maxAbs2, Math.abs(y2 - expected));
            maxAbs4 = Math.max(maxAbs4, Math.abs(y4 - expected));
          }
        }
      }
      console.log("Metric            DeFiMath   PRBMath    Solady");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1) + "  ", (maxRel4).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1) + "  ", (maxAbs4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "    " + (avgGas2 / count).toFixed(0), "     " + (avgGas4 / count).toFixed(0));
    });

    it("sqrt", async function () {
      const { deFiMath, prbMath, abdkMath, solady } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0, maxRel3 = 0, maxRel4 = 0;
      let maxAbs1 = 0, maxAbs2 = 0, maxAbs3 = 0, maxAbs4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: log-symmetric around 1, 1000 samples,
      // covers both below-1 and above-1 real values. Rel tracked where sqrt(x) >= 1
      // (x >= 1), abs where < 1. Abs is in real units — dividing wei delta by 1e18.
      for (let x = 1 / 16; x <= 16; x *= 256 ** (1 / 1000)) {
        const xWei = tokens(x);
        const expected = sqrtExactWei(xWei);

        const result1 = await deFiMath.sqrtMG(xWei);
        avgGas1 += parseInt(result1.gasUsed);
        const result2 = await prbMath.sqrtMG(xWei);
        avgGas2 += parseInt(result2.gasUsed);
        const result3 = await abdkMath.sqrtMG(xWei);
        avgGas3 += parseInt(result3.gasUsed);
        const result4 = await solady.sqrtMG(xWei);
        avgGas4 += parseInt(result4.gasUsed);

        if (x >= 1) {
          maxRel1 = Math.max(maxRel1, Number(relError(result1.y, expected)));
          maxRel2 = Math.max(maxRel2, Number(relError(result2.y, expected)));
          maxRel3 = Math.max(maxRel3, Number(relError(result3.y, expected)));
          maxRel4 = Math.max(maxRel4, Number(relError(result4.y, expected)));
        } else {
          maxAbs1 = Math.max(maxAbs1, Math.abs(Number(result1.y - BigInt(expected.floor().toString())) / 1e18));
          maxAbs2 = Math.max(maxAbs2, Math.abs(Number(result2.y - BigInt(expected.floor().toString())) / 1e18));
          maxAbs3 = Math.max(maxAbs3, Math.abs(Number(result3.y - BigInt(expected.floor().toString())) / 1e18));
          maxAbs4 = Math.max(maxAbs4, Math.abs(Number(result4.y - BigInt(expected.floor().toString())) / 1e18));
        }
        count++;
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1) + "  ", (maxRel3).toExponential(1) + "  ", (maxRel4).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1) + "  ", (maxAbs3).toExponential(1) + "  ", (maxAbs4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "      " + (avgGas2 / count).toFixed(0), "      " + (avgGas3 / count).toFixed(0), "      " + (avgGas4 / count).toFixed(0));
    });

    it("mulDiv", async function () {
      const { deFiMath, prbMath, solady } = await loadFixture(deployCompare);

      // Hand-picked input grid exercising both code paths:
      //   - fast path: a · b fits in uint256
      //   - slow path: a · b ≥ 2^256, full 512-bit division required
      const cases = [
        [1n, 1n, 1n],
        [1000n, 2000n, 7n],
        [12345678901234567890n, 98765432109876543210n, 1000000n],
        [BigInt(tokens(1.5)), BigInt(tokens(2)), BigInt(tokens(1))],
        [1n << 100n, 1n << 50n, 1n << 80n],
        [1n << 200n, 1n << 50n, 1n << 200n],          // slow path
        [(1n << 200n) - 1n, (1n << 100n) + 7n, (1n << 150n) + 3n],
        [1n << 255n, 2n, 4n],
        [(1n << 256n) - 1n, (1n << 256n) - 1n, (1n << 256n) - 1n],
      ];

      let maxError1 = 0n, maxError2 = 0n, maxError3 = 0n;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0;

      for (const [a, b, d] of cases) {
        const expected = (a * b) / d;

        const r1 = await deFiMath.mulDivMG(a, b, d);
        avgGas1 += parseInt(r1.gasUsed);
        const e1 = BigInt(r1.z.toString()) - expected;
        if ((e1 < 0n ? -e1 : e1) > maxError1) maxError1 = e1 < 0n ? -e1 : e1;

        const r2 = await prbMath.mulDivMG(a, b, d);
        avgGas2 += parseInt(r2.gasUsed);
        const e2 = BigInt(r2.z.toString()) - expected;
        if ((e2 < 0n ? -e2 : e2) > maxError2) maxError2 = e2 < 0n ? -e2 : e2;

        const r3 = await solady.mulDivMG(a, b, d);
        avgGas3 += parseInt(r3.gasUsed);
        const e3 = BigInt(r3.z.toString()) - expected;
        if ((e3 < 0n ? -e3 : e3) > maxError3) maxError3 = e3 < 0n ? -e3 : e3;
      }

      const n = cases.length;
      console.log("Metric        DeFiMath  PRBMath   Solady");
      console.log("Max abs error  ", maxError1.toString().padStart(8), maxError2.toString().padStart(8), maxError3.toString().padStart(8));
      console.log("Avg gas        ", (avgGas1 / n).toFixed(0).padStart(8), (avgGas2 / n).toFixed(0).padStart(8), (avgGas3 / n).toFixed(0).padStart(8));
    });

    it("cbrt", async function () {
      const { deFiMath, solady } = await loadFixture(deployCompare);

      let maxRel1 = 0, maxRel2 = 0;
      let maxAbs1 = 0, maxAbs2 = 0;
      let avgGas1 = 0, avgGas2 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: log-symmetric around 1, 1000 samples,
      // covers both below-1 and above-1 real values. Rel tracked where cbrt(x) >= 1
      // (x >= 1), abs where < 1.
      for (let x = 1 / 16; x <= 16; x *= 256 ** (1 / 1000)) {
        const expected = Math.cbrt(x);

        const result1 = await deFiMath.cbrtMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await solady.cbrtMG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        count++;
        if (x >= 1) {
          maxRel1 = Math.max(maxRel1, Math.abs((y1 - expected) / expected));
          maxRel2 = Math.max(maxRel2, Math.abs((y2 - expected) / expected));
        } else {
          maxAbs1 = Math.max(maxAbs1, Math.abs(y1 - expected));
          maxAbs2 = Math.max(maxAbs2, Math.abs(y2 - expected));
        }
      }
      console.log("Metric            DeFiMath    Solady");
      console.log("Max rel error     ", (maxRel1).toExponential(1) + "  ", (maxRel2).toExponential(1));
      console.log("Max abs error     ", (maxAbs1).toExponential(1) + "  ", (maxAbs2).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "      " + (avgGas2 / count).toFixed(0));
    });

    it("stdNormCDF", async function () {
      const { deFiMath, solStat } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas4 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: symmetric around 0, 1000 samples,
      // both positive and negative branches balanced.
      for (let x = -6; x <= 6; x += 0.012) {
        const expected = bs.stdNormCDF(x);

        const result1 = await deFiMath.stdNormCDFMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result4 = await solStat.cdfMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        maxError1 = Math.max(maxError1, Math.abs(y1 - expected));
        maxError4 = Math.max(maxError4, Math.abs(y4 - expected));
      }
      console.log("Metric            DeFiMath  SolStat");
      console.log("Max abs error     ", (maxError1).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "    " + (avgGas4 / count).toFixed(0));
    });

    it("erf", async function () {
      const { deFiMath, solStat } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas4 = 0;
      let count = 0;

      // Synced with defimath's perf test grid: symmetric around 0, 1000 samples,
      // both positive and negative branches balanced.
      for (let x = -6; x <= 6; x += 0.012) {
        const expected = erf(x);

        const result1 = await deFiMath.erfMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result4 = await solStat.erfMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        maxError1 = Math.max(maxError1, Math.abs(y1 - expected));
        maxError4 = Math.max(maxError4, Math.abs(y4 - expected));
      }
      console.log("Metric            DeFiMath  SolStat");
      console.log("Max abs error     ", (maxError1).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "    " + (avgGas4 / count).toFixed(0));
    });

  });
});
