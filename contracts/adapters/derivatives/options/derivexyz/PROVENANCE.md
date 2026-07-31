# Derivexyz (Lyra) — provenance

Vendored: a Black-Scholes model + Greeks extracted from the Lyra options protocol (a Foundry
monorepo). Not npm/`github:`-linkable cleanly (Foundry remappings + monorepo entanglement), so
it's a documented copy.

- **Project:** Lyra / Derivexyz
- **Upstream:** https://github.com/lyra-finance/lyra-protocol  (mirror: https://github.com/derivexyz/v1-core)

## Files & attribution
| File | Origin | License |
| :--- | :----- | :------ |
| `BlackScholes.sol` | Lyra | ISC |
| `lib/Math.sol` | Lyra | ISC |
| `lib/FixedPointMathLib.sol` | recmo/experiment-solexp (per header) | ISC |
| `synthetix/DecimalMath.sol` | Synthetix (© 2019) | MIT |
| `synthetix/SignedDecimalMath.sol` | Synthetix (© 2019) | MIT |

## Modifications (to build standalone under Hardhat / solc 0.8.36)
Extracted from the monorepo; imports rewritten to local relative paths (`./lib`, `./synthetix`); pragmas bumped where needed.

## Status
**Attributed, not commit-pinned.** Unlike SolStat, this is a multi-file extract adapted from a large monorepo, so it isn't diff-verified to an exact upstream commit. The benchmarked code is the **verbatim vendored copy in this directory (git-tracked)** — that is the authoritative record of what's measured. Benchmarked via `AdapterDerivexyz.sol`.
