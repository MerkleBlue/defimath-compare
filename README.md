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
  Common.test.mjs     Shared helpers (tokens, time constants, etc.).
poc/blackscholes/optionsJS.mjs    JS reference implementation, used as truth
                                   for binary-option precision comparisons.
```

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

## License

MIT
