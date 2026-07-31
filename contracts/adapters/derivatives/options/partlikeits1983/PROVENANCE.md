# Party1983 / DeltaDex — provenance

Vendored: a Black-Scholes model from the DeltaDex project (GitHub user `partylikeits1983`).

- **Project:** DeltaDex (author `partylikeits1983`)
- **Upstream:** https://github.com/partylikeits1983/black_scholes_solidity

## Files & attribution
| File | Origin | License |
| :--- | :----- | :------ |
| `BlackScholesModel.sol` | DeltaDex | MIT |
| `lib/Statistics.sol` | DeltaDex | MIT |
| `lib/PRBMath.sol` | Paul Razvan Berg — **classic PRBMath (v2)** | Unlicense |
| `lib/PRBMathSD59x18.sol` | Paul Razvan Berg — classic PRBMath (v2) | Unlicense |

⚠ This bundles the **classic single-file PRBMath (v2)**, which is a *different library* from the standalone PRBMath v4 benchmark pinned to `@prb/math@4.1.2`. Both are legitimate and distinct.

## Modifications
Extracted; imports rewritten to relative paths; pragmas bumped for solc 0.8.36.

## Status
**Attributed, not commit-pinned.** The benchmarked code is the verbatim vendored copy here (git-tracked). Benchmarked via `AdapterParty.sol`.
