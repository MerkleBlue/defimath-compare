# Haptic — provenance

Vendored: a cash-or-nothing **binary options** model attributed to **Haptic**, built on top of a
vendored copy of **Lyra's** Black-Scholes.

- **Project:** Haptic (binary-options protocol)
- **Upstream:** **unconfirmed** — the Haptic source repo could not be located (small/older project). Attribution is by the `@author Haptic` header on `Binaries.sol`.

## Files & attribution
| File | Origin | License |
| :--- | :----- | :------ |
| `Binaries.sol` | Haptic | (per header) |
| `BlackScholes.sol` | **Lyra** (© 2022 Lyra) — Haptic reused Lyra's Black-Scholes | ISC-style |
| `libraries/FixedPointMathLib.sol` | Lyra | — |
| `libraries/Math.sol` | Lyra | — |
| `synthetix/DecimalMath.sol` | Synthetix (© 2019) | MIT |
| `synthetix/SignedDecimalMath.sol` | Synthetix (© 2019) | MIT |

The **binary-pricing** layer (`Binaries.sol`) is Haptic's; the underlying **Black-Scholes** is Lyra's (see the `derivexyz` adapter for Lyra's provenance).

## Modifications
Extracted; imports rewritten to relative paths; pragmas bumped for solc 0.8.36.

## Status
**Attributed, not commit-pinned; Haptic upstream repo unconfirmed.** The benchmarked code is the **verbatim vendored copy in this directory (git-tracked)** — that is the authoritative record of what's measured. Benchmarked via `AdapterHaptic.sol`.
