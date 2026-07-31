# SolStat — provenance

**Vendored** (not npm / `github:`-pinned) because `solstat` is a Foundry project whose sources
use Foundry remappings (`solmate/…`) that Hardhat cannot resolve from `node_modules`. Linking it
cleanly would require the `@nomicfoundation/hardhat-foundry` plugin; until then it stays a
documented copy — but a *version-known* one.

| | |
| :-- | :-- |
| Upstream | https://github.com/primitivefinance/solstat |
| Ref | **`v1.0.0-beta`** — commit `11818dab71c6f4ef8fb4ed7cafc50428d7ff1ee2` |

## Files (verified against upstream @ that tag)
- `lib/Gaussian.sol` — **identical to `src/Gaussian.sol`** except for one line:
  ```
  upstream:  import "solmate/utils/FixedPointMathLib.sol";
  here:      import "./FixedPointMathLib.sol";
  ```
  (the upstream Foundry remapping rewritten to a local relative import so it builds under Hardhat)
- `lib/Units.sol` — **byte-identical** to `src/Units.sol` (no changes)
- `lib/FixedPointMathLib.sol` — Solmate's `FixedPointMathLib` (transmissions11/solmate), bundled
  locally to satisfy Gaussian's import above. **Not part of solstat itself.**

## Benchmarked
`Gaussian.cdf`, `Gaussian.erfc` — see `AdapterSolStat.sol`.

## Verification
`diff` of the vendored `Gaussian.sol` / `Units.sol` against `solstat@v1.0.0-beta` is empty modulo
the single documented import line above. Re-run: fetch
`raw.githubusercontent.com/primitivefinance/solstat/v1.0.0-beta/src/{Gaussian,Units}.sol` and diff.
