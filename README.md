# VeilTab

**Midnight Network Buildathon — Wave 3 (AKINDO)**

VeilTab is a privacy-first group-tab settlement dApp built on **Midnight Network** using **Compact `0.36.1`**. A host opens a group tab with a **public total** and bounded participant count (`1..4`). Each participant commits a **salted hash** of their private share to the public ledger. The `sealAndProve` circuit proves in zero knowledge that the private witness shares match their commitments and **sum exactly to the public total**—transitioning the tab to `Balanced` without ever revealing individual shares on-chain. Any participant may optionally call `discloseMyShare` afterward to selectively reveal only their own share for receipt or accounting purposes.

---

## Architecture & Dual-Ledger Privacy

| Layer | Data | Visibility |
|---|---|---|
| **Public Ledger (`veiltab.compact`)** | `tabTotal`, `capacity`, `commitmentCount`, `state` (`Unopened`/`Open`/`Balanced`), `commit0..commit3` (32-byte `persistentHash` commitments), optional `disclosedSlot` & `disclosedAmount` | Visible on-chain |
| **Private State / Witnesses** | `localShare0..3` (`Uint<64>`), `localSalt0..3` (`Bytes<32>`) | Strictly local to prover; never written to public ledger |

### Circuits (`contracts/veiltab.compact`)
- `openTab(total, participantCount)` — Initializes public tab total and bounded capacity (`1..4`).
- `commitShare(slot, shareAmount, shareSalt)` — Records only `disclose(persistentHash([shareAmount, shareSalt]))` on-chain; keeps raw share and salt private.
- `sealAndProve()` — Reads private share/salt witnesses, checks each commitment hash, verifies `sum(shares) == tabTotal`, and transitions `state` to `Balanced`.
- `discloseMyShare(slot, shareAmount, shareSalt)` — Optional selective disclosure of a single participant's share once `Balanced`.

---

## Prerequisites & Quickstart

- **Compact Toolchain:** `0.36.1` (`compact compile --version`)
- **Node.js:** `22` or `24` (verified on Node `v24.22.1`)

```bash
# 1. Install dependencies (@midnight-ntwrk/compact-runtime@0.21.0)
npm install

# 2. Compile the Compact contract (generates contract/index.js, keys/, zkir/)
npm run compile

# 3. Run automated tests against the compiled Compact 0.36.1 contract
npm test

# 4. Launch the local interactive UI connected to the compiled Compact runtime
npm run dev
# Open http://127.0.0.1:8795
```

> **Local Devnet Note:** All Compact compilation (`0.36.1`), automated circuit tests (`@midnight-ntwrk/compact-runtime@0.21.0`), and end-to-end UI tests run locally with **$0 cost** and zero mainnet calls. Because Docker Engine is not installed on our build box, we verified the compiled Compact contract directly through the official `@midnight-ntwrk/compact-runtime` simulator rather than spinning up a Docker Compose node; judges with Docker Engine can pair `contracts/managed/veiltab/` with Midnight's local Docker devnet (`compose.yml`) directly.

---

## Wave 3 Progress Summary
- Authored original `contracts/veiltab.compact` (`pragma language_version 0.28;`) from scratch and compiled all 4 circuits with Compact `0.36.1`.
- Implemented `src/simulator.mjs` + `tests/veiltab.test.mjs` proving balanced sealing, unbalanced rejection, witness-tamper rejection, privacy invariants, and selective disclosure (**4/4 PASS**).
- Built `src/server.mjs` + `web/` interactive dual-ledger inspector UI talking directly to the compiled Compact contract.
- Authored pitch deck source in `slides/pitch-deck.md` and licensed under **Apache-2.0**.

## License
Licensed under the **Apache License, Version 2.0** — see [LICENSE](./LICENSE).
