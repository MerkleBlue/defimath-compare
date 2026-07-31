# Premia — provenance

Vendored: the `OptionMath` Black-Scholes model extracted from the Premia protocol (Foundry
monorepo). Not cleanly npm/`github:`-linkable, so it's a documented copy.

- **Project:** Premia
- **Upstream:** https://github.com/Premian-Labs/premia-contracts

## Files & attribution
| File | Origin | License |
| :--- | :----- | :------ |
| `OptionMath.sol` | Premia | BUSL-1.1 |
| `lib/ABDKMath64x64.sol` | ABDK Consulting (© 2019) | BSD-4-Clause |

## Modifications
Extracted; imports rewritten to relative paths; pragmas bumped for solc 0.8.36.

## Status
**Attributed, not commit-pinned** (multi-file monorepo extract). The benchmarked code is the verbatim vendored copy here (git-tracked). Note: `ABDKMath64x64` is Premia's own bundled copy — the *standalone* ABDK benchmark is separately pinned to `abdk-libraries-solidity@3.2.0` (a different adapter). Benchmarked via `AdapterPremia.sol`.
