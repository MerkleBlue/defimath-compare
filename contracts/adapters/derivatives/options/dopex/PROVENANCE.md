# Dopex — provenance

Vendored: a Black-Scholes pricing model attributed (in its header) to **Dopex**.

- **Project:** Dopex (since rebranded "Stryke")
- **Upstream:** **unconfirmed** — the original `dopex-io` source repo could not be located (appears archived/removed; project rebranded). Attribution is by the `@author Dopex` header.

## Files & attribution
| File | Origin | License |
| :--- | :----- | :------ |
| `BlackScholes.sol` | Dopex | UNLICENSED |
| `lib/ABDKMathQuad.sol` | ABDK Consulting (© 2019) | BSD-4-Clause |

## Modifications
Extracted; imports rewritten to relative paths; pragmas bumped for solc 0.8.36.

## Status
**Attributed, not commit-pinned; upstream repo unconfirmed.** The benchmarked code is the **verbatim vendored copy in this directory (git-tracked)** — that is the authoritative record of what's measured. `ABDKMathQuad` is Dopex's own bundled copy (the standalone ABDK benchmark is pinned separately to `abdk-libraries-solidity@3.2.0`). Benchmarked via `AdapterDopex.sol`.
