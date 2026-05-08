
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers.js";
import bs from "black-scholes";
import erf from 'math-erf';
import { tokens } from "./Common.test.mjs";

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

      let maxError1 = 0, maxError2 = 0, maxError3 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0;
      let count = 0;

      for (let x = -10; x <= 10; x += 0.123) {
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
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError2 = Math.max(maxError2, Math.abs((y2 - expected) / expected) * 100);
        maxError3 = Math.max(maxError3, Math.abs((y3 - expected) / expected) * 100);
        maxError4 = Math.max(maxError4, Math.abs((y4 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1) + "  ", (maxError3).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0), "     " + (avgGas3 / count).toFixed(0), "      " + (avgGas4 / count).toFixed(0));
    });

    it("ln", async function () {
      const { deFiMath, prbMath, abdkMath, solady } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError2 = 0, maxError3 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0;
      let count = 0;

      for (let x = 1/16; x <= 16; x += 0.0123) {
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
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError2 = Math.max(maxError2, Math.abs((y2 - expected) / expected) * 100);
        maxError3 = Math.max(maxError3, Math.abs((y3 - expected) / expected) * 100);
        maxError4 = Math.max(maxError4, Math.abs((y4 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1) + "  ", (maxError3).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0), "    " + (avgGas3 / count).toFixed(0), "      " + (avgGas4 / count).toFixed(0));
    });

    it("log2", async function () {
      const { deFiMath, prbMath, abdkMath } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError2 = 0, maxError3 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0;
      let count = 0;

      for (let x = 1/16; x <= 16; x += 0.0123) {
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
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError2 = Math.max(maxError2, Math.abs((y2 - expected) / expected) * 100);
        maxError3 = Math.max(maxError3, Math.abs((y3 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1) + "  ", (maxError3).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0), "    " + (avgGas3 / count).toFixed(0));
    });

    it("log10", async function () {
      const { deFiMath, prbMath } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError2 = 0;
      let avgGas1 = 0, avgGas2 = 0;
      let count = 0;

      for (let x = 1/16; x <= 16; x += 0.0123) {
        const expected = Math.log10(x);

        const result1 = await deFiMath.log10MG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await prbMath.log10MG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        count++;
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError2 = Math.max(maxError2, Math.abs((y2 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "     " + (avgGas2 / count).toFixed(0));
    });

    it("pow", async function () {
      const { deFiMath, prbMath, solady } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError2 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas4 = 0;
      let count = 0;

      for (let x = 0.5; x <= 10; x += 0.317) {
        for (let a = -2; a <= 2; a += 0.413) {
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
          maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
          maxError2 = Math.max(maxError2, Math.abs((y2 - expected) / expected) * 100);
          maxError4 = Math.max(maxError4, Math.abs((y4 - expected) / expected) * 100);
        }
      }
      console.log("Metric            DeFiMath   PRBMath    Solady");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "    " + (avgGas2 / count).toFixed(0), "     " + (avgGas4 / count).toFixed(0));
    });

    it("sqrt", async function () {
      const { deFiMath, prbMath, abdkMath, solady } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError2 = 0, maxError3 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas2 = 0, avgGas3 = 0, avgGas4 = 0;
      let count = 0;

      for (let x = 1e-4; x <= 1e4; x += x / 4) {
        const expected = Math.sqrt(x);

        const result1 = await deFiMath.sqrtMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result2 = await prbMath.sqrtMG(tokens(x));
        const y2 = result2.y.toString() / 1e18;
        avgGas2 += parseInt(result2.gasUsed);

        const result3 = await abdkMath.sqrtMG(tokens(x));
        const y3 = result3.y.toString() / 1e18;
        avgGas3 += parseInt(result3.gasUsed);

        const result4 = await solady.sqrtMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError2 = Math.max(maxError2, Math.abs((y2 - expected) / expected) * 100);
        maxError3 = Math.max(maxError3, Math.abs((y3 - expected) / expected) * 100);
        maxError4 = Math.max(maxError4, Math.abs((y4 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath   PRBMath  ABDKQuad    Solady");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError2).toExponential(1) + "  ", (maxError3).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "      " + (avgGas2 / count).toFixed(0), "      " + (avgGas3 / count).toFixed(0), "      " + (avgGas4 / count).toFixed(0));
    });

    it("stdNormCDF", async function () {
      const { deFiMath, solStat } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas4 = 0;
      let count = 0;

      for (let x = 0.5; x <= 10; x += 0.123) {
        const expected = bs.stdNormCDF(x);

        const result1 = await deFiMath.stdNormCDFMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result4 = await solStat.cdfMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError4 = Math.max(maxError4, Math.abs((y4 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath  SolStat");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "    " + (avgGas4 / count).toFixed(0));
    });

    it("erf", async function () {
      const { deFiMath, solStat } = await loadFixture(deployCompare);

      let maxError1 = 0, maxError4 = 0;
      let avgGas1 = 0, avgGas4 = 0;
      let count = 0;

      for (let x = 0.5; x <= 10; x += 0.123) {
        const expected = erf(x);

        const result1 = await deFiMath.erfMG(tokens(x));
        const y1 = result1.y.toString() / 1e18;
        avgGas1 += parseInt(result1.gasUsed);

        const result4 = await solStat.erfMG(tokens(x));
        const y4 = result4.y.toString() / 1e18;
        avgGas4 += parseInt(result4.gasUsed);

        count++;
        maxError1 = Math.max(maxError1, Math.abs((y1 - expected) / expected) * 100);
        maxError4 = Math.max(maxError4, Math.abs((y4 - expected) / expected) * 100);
      }
      console.log("Metric            DeFiMath  SolStat");
      console.log("Max rel error (%) ", (maxError1).toExponential(1) + "  ", (maxError4).toExponential(1));
      console.log("Avg gas               ", (avgGas1 / count).toFixed(0), "    " + (avgGas4 / count).toFixed(0));
    });
  });
});
