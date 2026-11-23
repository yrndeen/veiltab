# VeilTab — Private Group-Tab Settlement on Midnight
*Midnight Network Buildathon · Wave 3 (AKINDO)*

---

## Slide 1: The Problem
- Group expenses, DAO vendor splits, and team reimbursements require proving that individual contributions add up to the invoice total.
- On transparent chains, publishing every participant's split leaks salaries, vendor rates, and personal spending habits permanently.
- Off-chain spreadsheets hide amounts but provide zero cryptographic guarantee that the split actually balances.

---

## Slide 2: Why Midnight Network
- Midnight's **dual-ledger model** and **Compact** language let us put only what auditors need on the public ledger (`tabTotal`, `capacity`, salted commitments, `Balanced` status) while keeping individual shares and salts strictly in **private witness state**.
- **Selective disclosure (`discloseMyShare`)** lets a single participant prove and reveal their own share for tax or accounting receipts without exposing anyone else's share.

---

## Slide 3: Architecture (`contracts/veiltab.compact`)
- **Public Ledger:** `tabTotal: Uint<64>`, `capacity: Uint<8>`, `commitmentCount: Uint<8>`, `state: TabState` (`Unopened | Open | Balanced`), `commit0..commit3: Bytes<32>`, optional `disclosedSlot` / `disclosedAmount`.
- **Private Witnesses:** `localShare0..3(): Uint<64>` and `localSalt0..3(): Bytes<32>`.
- **4 Compiled ZK Circuits (Compact `0.36.1`, `pragma language_version 0.28`):**
  1. `openTab(total, participantCount)` — sets public total and bounded capacity (`1..4`).
  2. `commitShare(slot, shareAmount, shareSalt)` — writes only `persistentHash([amount, salt])` publicly.
  3. `sealAndProve()` — verifies every commitment against private witnesses and asserts `sum(shares) == tabTotal` before setting `state = Balanced`.
  4. `discloseMyShare(slot, shareAmount, shareSalt)` — optional per-participant selective disclosure after `Balanced`.

---

## Slide 4: Privacy & Security Guarantees
- **Zero amount leakage:** Serialized public ledger state after `sealAndProve()` contains only 32-byte salted commitments and the `Balanced` flag—never raw individual shares.
- **Unbalanced tabs fail in-circuit:** Any sum mismatch (`sum != tabTotal`) aborts `sealAndProve()`.
- **Witness tamper protection:** Changing local private state after committing fails the commitment hash assertion.
- **Strict lifecycle guards:** Prevents re-opening, duplicate slot commits, out-of-bounds slots, early sealing, and pre-seal disclosure.

---

## Slide 5: Verification & Test Evidence
- **Compact Compilation:** `compact compile contracts/veiltab.compact contracts/managed/veiltab` (Compact `0.36.1`) — exit `0`, generating all 4 prover/verifier key pairs + ZKIR + JS/TS contract artifacts.
- **Automated Circuit Tests:** `npm test` against `@midnight-ntwrk/compact-runtime@0.21.0` — **4/4 PASS** (happy path + privacy check, unbalanced rejection, witness-tamper rejection, lifecycle & selective-disclosure proofs).
- **End-to-End Web UI:** Local HTTP server (`src/server.mjs`) + interactive UI (`web/`) wired directly to the compiled Compact runtime, verified in headless Chromium via Playwright (0 console/page errors).

---

## Slide 6: Wave 3 Progress
- Designed and authored original Compact contract `veiltab.compact` from scratch (not a fork of official tutorials).
- Built local Compact runtime harness, automated circuit test suite, and live dual-ledger inspector UI showing Public Ledger vs. Private Witness state side by side.
- Packaged under **Apache-2.0** license with full setup and judging instructions.

---

## Slide 7: Next Steps
- Deploy `veiltab.compact` to Midnight Preview/Preprod via MidnightJS + Lace wallet integration once approved.
- Extend participant capacity via Merkle commitment tree for larger DAO payroll splits.
- Add downloadable zero-knowledge receipt bundles for accounting tools.
