// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

import "solady/src/utils/FixedPointMathLib.sol";

contract AdapterSolady {

    function expMG(int256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = FixedPointMathLib.expWad(x);
        endGas = gasleft();
        
        return (y, startGas - endGas);
    }

    function lnMG(int256 x) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = FixedPointMathLib.lnWad(x);
        endGas = gasleft();
        
        return (y, startGas - endGas);
    }

    // function log2MG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
    //     uint256 startGas;
    //     uint256 endGas;

    //     startGas = gasleft();
    //     y = FixedPointMathLib.log2(x * 1e18 / 2 ** 64);
    //     endGas = gasleft();
        
    //     return (y, startGas - endGas);
    // }

    // function log10MG(int256 x) external view returns (int256 y, uint256 gasUsed) {
    //     SD59x18 result;
    //     uint256 startGas;
    //     uint256 endGas;
    //     SD59x18 sdX = sd(x);

    //     startGas = gasleft();
    //     result = log10(sdX);
    //     endGas = gasleft();
        
    //     return (result.unwrap(), startGas - endGas);
    // }

    function powMG(int256 x, int256 a) external view returns (int256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        y = FixedPointMathLib.powWad(x, a);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function sqrtMG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        // Solady's native fixed-point sqrt (mirrors cbrtWad below). Like DeFiMath's,
        // it two-branches at type(uint256).max / 1e18 and accepts the full uint256
        // domain without reverting — so this is a like-for-like comparison.
        y = FixedPointMathLib.sqrtWad(x);
        endGas = gasleft();
        
        gasUsed = startGas - endGas;
        return (y, gasUsed);
    }

    function cbrtMG(uint256 x) external view returns (uint256 y, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        // cbrtWad is Solady's 1e18-FP cube root — direct apples-to-apples with DeFiMath.cbrt
        y = FixedPointMathLib.cbrtWad(x);
        endGas = gasleft();

        return (y, startGas - endGas);
    }

    function mulDivMG(uint256 a, uint256 b, uint256 d) external view returns (uint256 z, uint256 gasUsed) {
        uint256 startGas;
        uint256 endGas;

        startGas = gasleft();
        // fullMulDiv is Solady's 512-bit-precision a·b/d — apples-to-apples with DeFiMath.mulDiv
        z = FixedPointMathLib.fullMulDiv(a, b, d);
        endGas = gasleft();

        return (z, startGas - endGas);
    }

}
