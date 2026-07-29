// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "defimath-lib/contracts/math/Math.sol";

contract MathWrapper {

    function exp(int256 x) external pure returns (uint256) {
        return Math.exp(x);
    }

    function ln(uint256 x) external pure returns (int256) {
        return Math.ln(x);
    }

    function log2(uint256 x) external pure returns (int256) {
        return Math.log2(x);
    }

    function log10(uint256 x) external pure returns (int256) {
        return Math.log10(x);
    }

    function pow(uint256 x, int256 a) external pure returns (uint256) {
        return Math.pow(x, a);
    }

    function sqrtTime(uint256 x) external pure returns (uint256) {
        return Math.sqrtTime(x);
    }

    function sqrt(uint256 x) external pure returns (uint256) {
        return Math.sqrt(x);
    }

    function cbrt(uint256 x) external pure returns (uint256) {
        return Math.cbrt(x);
    }

    function mulDiv(uint256 a, uint256 b, uint256 d) external pure returns (uint256) {
        return Math.mulDiv(a, b, d);
    }

    function stdNormCDF(int256 x) external pure returns (uint256) {
        return Math.stdNormCDF(x);
    }

    function erf(int256 x) external pure returns (int256) {
        return Math.erf(x);
    }

    function expPositive(uint256 x) external pure returns (uint256) {
        return Math.expPositive(x);
    }

    // measure gas functions

    function expMG(int256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 result;
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();

        result = Math.exp(x);

        endGas = gasleft();

        return (result, startGas - endGas);
    }

    function expPositiveMG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 result;
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();

        result = Math.expPositive(x);

        endGas = gasleft();

        return (result, startGas - endGas);
    }

    function lnMG(uint256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.ln(x);
        endGas = gasleft();
        
        return (y, startGas - endGas);
    }

    function log2MG(uint256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.log2(x);
        endGas = gasleft();
        
        return (y, startGas - endGas);
    }

    function log10MG(uint256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.log10(x);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function powMG(uint256 x, int256 a) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.pow(x, a);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function sqrtMG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.sqrt(x);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function cbrtMG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.cbrt(x);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function mulDivMG(uint256 a, uint256 b, uint256 d) external view returns (uint256 z, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        z = Math.mulDiv(a, b, d);
        endGas = gasleft();

        return (z, startGas - endGas);
    }

    function sqrtTimeMG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = Math.sqrtTime(x);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function stdNormCDFMG(int256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;
        startGas = gasleft();

        y = Math.stdNormCDF(x);

        endGas = gasleft();
        
        return (y, startGas - endGas);
    }

    function erfMG(int256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;
        startGas = gasleft();

        y = Math.erf(x);

        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function expm1MG(int256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas = gasleft();
        y = Math.expm1(x);
        uint256 endGas = gasleft();
        return (y, startGas - endGas);
    }

    function log1pMG(int256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas = gasleft();
        y = Math.log1p(x);
        uint256 endGas = gasleft();
        return (y, startGas - endGas);
    }
}
