# defimath-compare

Gas and precision benchmarks comparing [DeFiMath](https://defimath.com) ([source](https://github.com/MerkleBlue/defimath)) against other Solidity math and options-pricing libraries.

This repository is **not published** to npm. It exists to produce the comparison tables in DeFiMath's README and to detect regressions when DeFiMath is changed.

## What gets compared

DeFiMath is benchmarked against:

| Category    | Libraries |
| :---------- | :-------- |
| Math        | PRBMath, ABDK, Solady, SolStat |
| Options     | Derivexyz, Premia, Party1983, Dopex |
| Binary      | Haptic |
| Rates       | — (no other on-chain implementations found) |
| Statistics  | — (no other on-chain implementations found) |

Each function is measured for:
- **Average gas** (over a typical input range)
- **Maximum absolute or relative error** vs. a JavaScript reference (`black-scholes`, `greeks`, `math-erf`)

## Running

```bash
npm install
npx hardhat test
```

Each test prints a table like:

```
Metric         DeFiMath  Derivexyz  Premia  Party1983   Dopex
Max abs error   5.6e-12    6.8e-13  1.7e-1     3.8e+1
Avg gas            2927      13404   20831      36243   89728
  ✔ call
```

## Results — Math primitives

### Gas (average over input sweep)

| Function     |    DeFiMath | PRBMath | ABDKQuad |  Solady | SolStat |
| :----------- | ----------: | ------: | -------: | ------: | ------: |
| `exp`        |     **333** |   2,820 |    5,840 |     372 |       — |
| `ln`         |     **375** |   6,901 |   12,695 |     518 |       — |
| `log2`       |     **391** |   6,828 |   12,271 |       — |       — |
| `log10`      |     **391** |   8,626 |        — |       — |       — |
| `pow`        |     **750** |   9,792 |        — |     976 |       — |
| `sqrt`       |     **245** |     959 |      808 |     341 |       — |
| `cbrt`       |     **368** |       — |        — |     550 |       — |
| `stdNormCDF` |     **731** |       — |        — |       — |   2,794 |
| `erf`        |     **685** |       — |        — |       — |   1,732 |
| `expm1` †    |         439 |   2,735 |    5,851 | **372** |       — |
| `log1p` †    |     **500** |   6,842 |   13,228 |     518 |       — |

### Max relative error (%)

| Function     |    DeFiMath |     PRBMath |    ABDKQuad |      Solady |  SolStat |
| :----------- | ----------: | ----------: | ----------: | ----------: | -------: |
| `exp`        |     5.1e-12 | **1.9e-12** | **1.9e-12** | **1.9e-12** |        — |
| `ln`         |     1.5e-12 | **1.3e-12** |     1.6e-12 |     1.6e-12 |        — |
| `log2`       |     1.5e-12 | **1.3e-12** |     1.6e-12 |           — |        — |
| `log10`      |     1.4e-12 | **1.3e-12** |           — |           — |        — |
| `pow`        |     5.2e-12 | **6.1e-14** |           — | **6.1e-14** |        — |
| `sqrt`       | **2.8e-14** | **2.8e-14** | **2.8e-14** | **2.8e-14** |        — |
| `cbrt`       | **2.2e-14** |           — |           — | **2.2e-14** |        — |
| `stdNormCDF` | **4.7e-13** |           — |           — |           — |   3.2e-6 |
| `erf`        | **7.4e-13** |           — |           — |           — |   5.7e-6 |
| `expm1` †    |     9.9e-12 | **1.2e-12** | **1.2e-12** | **1.2e-12** |        — |
| `log1p` †    | **7.0e-13** |     2.3e-11 |     5.1e-12 |     3.6e-12 |        — |

† Competitors don't ship `expm1` / `log1p` natively; their numbers reflect the naive `exp(x) − 1` and `ln(1 + x)` formulas. Bold entries mark the best (lowest) value in each row; ties bold all leaders. Grids and parameters match the test sources in [`test/Math.test.mjs`](test/Math.test.mjs); reproduce with `npx hardhat test test/Math.test.mjs`.

## Results — European options (Black-Scholes + Greeks)

### Gas (average over spot × strike × time × vol × rate sweep)

| Function          | DeFiMath  | Derivexyz | Premia | Party1983 |  Dopex |
| :---------------- | --------: | --------: | -----: | --------: | -----: |
| `callOptionPrice` | **2,876** |    13,360 | 20,623 |    35,963 | 88,969 |
| `putOptionPrice`  | **2,887** |    13,363 | 20,791 |    36,140 | 88,301 |
| `delta`           | **1,797** |     8,621 |      — |    24,960 |      — |
| `gamma`           | **1,499** |         — |      — |         — |      — |
| `theta`           | **3,441** |         — |      — |         — |      — |
| `vega`            | **1,439** |     7,490 |      — |         — |      — |

### Max absolute error (option price at $1,000 spot, unit Greeks)

| Function          | DeFiMath    | Derivexyz   | Premia | Party1983 | Dopex |
| :---------------- | ----------: | ----------: | -----: | --------: | ----: |
| `callOptionPrice` |     5.6e-12 | **6.8e-13** | 1.7e-1 |     3.8e1 |     — |
| `putOptionPrice`  |     5.4e-12 | **6.5e-13** | 1.7e-1 |     9.9e1 |     — |
| `delta`           |     6.2e-15 | **6.7e-16** |      — |    9.2e-1 |     — |
| `gamma`           | **9.1e-17** |          — |      — |         — |     — |
| `theta`           | **3.5e-14** |          — |      — |         — |     — |
| `vega`            |     4.3e-14 | **1.1e-15** |      — |         — |     — |

Dashes indicate the library doesn't implement that function. Dopex returns prices in a different scale and is benchmarked on gas only. Grids and parameters match [`test/Options.test.mjs`](test/Options.test.mjs); reproduce with `npx hardhat test test/Options.test.mjs`.

## Results — Binary (cash-or-nothing) options

### Gas (average over spot × strike × time × vol × rate sweep)

| Function          | DeFiMath  | Haptic |
| :---------------- | --------: | -----: |
| `binaryCallPrice` | **2,092** | 16,218 |
| `binaryPutPrice`  | **2,097** | 16,221 |
| `binaryDelta`     | **1,825** |      — |
| `binaryGamma`     | **1,967** |      — |
| `binaryTheta`     | **3,501** |      — |
| `binaryVega`      | **1,913** |      — |

### Max absolute error (unit payout)

| Function          | DeFiMath    | Haptic      |
| :---------------- | ----------: | ----------: |
| `binaryCallPrice` |     6.2e-15 | **5.6e-16** |
| `binaryPutPrice`  |     5.9e-15 | **5.6e-16** |
| `binaryDelta`     | **1.3e-16** |           — |
| `binaryGamma`     | **1.5e-18** |           — |
| `binaryTheta`     | **8.3e-16** |           — |
| `binaryVega`      | **2.7e-16** |           — |

Haptic is the only on-chain binary-options implementation we found. It doesn't ship greeks, so `binaryDelta` / `binaryGamma` / `binaryTheta` / `binaryVega` rows show DeFiMath only. DeFiMath wins gas on `binaryCallPrice` / `binaryPutPrice` by ~7.7×; Haptic edges price precision by ~11×, both well below ulp at unit payout. Precision is measured against a true-math Black-Scholes reference (`Math.log` / `Math.exp` / `math-erf`), independent of any DeFiMath algorithm. Grids match [`test/Binary.test.mjs`](test/Binary.test.mjs); reproduce with `npx hardhat test test/Binary.test.mjs`.

## Results — Interest & rates

We found no other on-chain interest-rate libraries to benchmark against, so this section reports DeFiMath measurements only.

| Function               | Avg gas | Max rel error (%) |
| :--------------------- | ------: | ----------------: |
| `compoundInterest`     |     467 |           2.8e-12 |
| `presentValue`         |     519 |           2.8e-12 |
| `logReturn`            |     591 |           7.1e-14 |
| `continuousToDiscrete` |     509 |           2.4e-12 |
| `discreteToContinuous` |     590 |           5.1e-14 |
| `yieldToMaturity`      |     736 |           2.7e-12 |
| `internalRateOfReturn` |  13,476 |           3.7e-13 |

`internalRateOfReturn` gas scales with cashflow count; the figure above averages over scenarios of 2–5 cashflows. Grids and parameters match [`test/Rates.test.mjs`](test/Rates.test.mjs); reproduce with `npx hardhat test test/Rates.test.mjs`.

## Results — Statistics

We found no other on-chain statistics libraries to benchmark against, so this section reports DeFiMath measurements only. Array-input functions are measured on 30-element inputs; their gas scales with input length.

| Function                 | Avg gas | Max rel error (%) |
| :------------------------ | ------: | ----------------: |
| `geometricMean`           |     330 |           1.2e-14 |
| `mean`                    |   6,980 |           1.7e-14 |
| `stdDev`                  |  15,298 |           4.2e-14 |
| `weightedAverage`         |  15,687 |           2.8e-14 |
| `historicalVolatility`    |  26,135 |           1.6e-12 |
| `sharpeRatio`             |  26,273 |           2.2e-12 |
| `maxDrawdown`             |  15,191 |           9.9e-14 |
| `valueAtRisk`             |  36,752 |           1.9e-12 |
| `conditionalValueAtRisk`  |  32,917 |           2.5e-12 |

`valueAtRisk` precision is measured against `simple-statistics`' `quantile`; all others against direct JavaScript reference implementations. Grids and parameters match [`test/Stats.test.mjs`](test/Stats.test.mjs); reproduce with `npx hardhat test test/Stats.test.mjs`.

## Layout

```
contracts/
  wrappers/    Thin Solidity contracts that import DeFiMath via npm and expose
               *MG variants returning gas used. Equivalent to the wrappers in
               defimath itself, but the import path is "defimath-lib/contracts/...".
  adapters/    Each comparison library lives here under its own subdirectory,
               with a small adapter contract that conforms to a common interface.
test/
  Math.test.mjs       Compare suite for the DeFiMath math library.
  Options.test.mjs    Compare suite for European option pricing + Greeks + IV.
  Binary.test.mjs     Compare suite for cash-or-nothing binary options.
  Rates.test.mjs      Measure suite for interest-rate functions (DeFiMath-only).
  Stats.test.mjs      Measure suite for statistics functions (DeFiMath-only).
  Common.test.mjs     Shared helpers (tokens, time constants, etc.).
```

Precision references are independent of DeFiMath's algorithms: `black-scholes` /
`greeks` / `math-erf` (npm), `simple-statistics` (npm), and inline true-math
implementations (`Math.log` / `Math.exp` / `Math.sqrt`).

## How it works

The `OptionsWrapper`, `MathWrapper`, etc. contracts in `contracts/wrappers/` import DeFiMath from npm:

```solidity
import "defimath-lib/contracts/derivatives/Options.sol";

contract OptionsWrapper {
    function getCallOptionPriceMG(...) external view returns (uint256 price, uint256 gasUsed) {
        uint256 startGas = gasleft();
        price = DeFiMathOptions.getCallOptionPrice(...);
        gasUsed = startGas - gasleft();
    }
    // ...
}
```

Because DeFiMath functions are `internal` libraries, Solc inlines them into the wrapper at compile time — generating the same bytecode the wrapper-in-defimath would. Gas measurements are therefore directly comparable to a "real" deployment of DeFiMath that calls these library functions.

Adapters in `contracts/adapters/` follow the same shape: they wrap each third-party library's API behind a common interface, so the test files can call them uniformly.

## Local development against unreleased DeFiMath

By default `package.json` pins `defimath-lib` to its published version. When iterating on DeFiMath itself and you want changes to surface here without a publish cycle, use `npm link`:

```bash
# in the defimath repo
cd ~/path/to/defimath && npm link

# in this repo
cd ~/path/to/defimath-compare && npm link defimath-lib
```

This replaces `node_modules/defimath-lib` with a symlink to your local checkout. Edits in DeFiMath's `contracts/` are picked up by the next `npx hardhat compile`. Revert with:

```bash
npm unlink defimath-lib && npm install
```

## Compiler settings

Solidity version, viaIR, and optimizer runs are pinned to the same values as in defimath's `hardhat.config.js`. If you change either side, change both — gas numbers depend on the compiler settings, not just the library code.

## Credits

This project would not be possible without the open-source libraries it benchmarks against. Thanks to the authors and maintainers of:

- [Derivexyz](https://github.com/derivexyz/v1-core/blob/master/contracts/libraries/BlackScholes.sol)
- [Premia](https://github.com/Premian-Labs/premia-contracts/blob/master/contracts/libraries/OptionMath.sol)
- [Party1983](https://github.com/partylikeits1983/black_scholes_solidity/blob/main/contracts/libraries/BlackScholesModel.sol)
- [Dopex](https://github.com/code-423n4/2023-08-dopex/blob/main/contracts/libraries/BlackScholes.sol)
- [PRBMath](https://github.com/PaulRBerg/prb-math)
- [ABDK](https://github.com/abdk-consulting/abdk-libraries-solidity)
- [Solady](https://github.com/Vectorized/solady)
- [SolStat](https://github.com/primitivefinance/solstat)
- [Haptic](https://github.com/HapticFinance/binaries-pricing-model)

## License

MIT
