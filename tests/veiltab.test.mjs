import test from "node:test";
import assert from "node:assert/strict";
import { VeilTabRuntime, TabState, createSalt } from "../src/simulator.mjs";

const ZERO_COMMIT = "0x" + "00".repeat(32);

test("VeilTab happy path: private shares prove exact sum to public total without revealing amounts", async () => {
  const vt = await new VeilTabRuntime().init();
  assert.equal(vt.getPublicLedger().state, TabState.Unopened);

  // Open a $100.00 (10000 cents) tab for 3 participants
  await vt.openTab(10000n, 3n);
  let pub = vt.getPublicLedger();
  assert.equal(pub.state, TabState.Open);
  assert.equal(pub.tabTotal, 10000n);
  assert.equal(pub.capacity, 3n);
  assert.equal(pub.commitmentCount, 0n);

  // Commit 3 private salted shares summing to 10000 (3500 + 4500 + 2000)
  const salt0 = createSalt("alice-salt");
  const salt1 = createSalt("bob-salt");
  const salt2 = createSalt("carol-salt");
  await vt.commitShare(0, 3500n, salt0);
  await vt.commitShare(1, 4500n, salt1);
  await vt.commitShare(2, 2000n, salt2);

  pub = vt.getPublicLedger();
  assert.equal(pub.commitmentCount, 3n);
  assert.notEqual(pub.commitments[0], ZERO_COMMIT);
  assert.notEqual(pub.commitments[1], ZERO_COMMIT);
  assert.notEqual(pub.commitments[2], ZERO_COMMIT);
  assert.equal(pub.commitments[3], ZERO_COMMIT);

  // Seal & prove sum == 10000 without disclosing shares
  pub = await vt.sealAndProve();
  assert.equal(pub.state, TabState.Balanced);
  assert.equal(pub.hasDisclosure, false);
  assert.equal(pub.disclosedAmount, 0n);

  // Privacy invariant: serialized public ledger does NOT contain private share numbers
  const pubJson = JSON.stringify(pub, (_, v) => (typeof v === "bigint" ? v.toString() : v));
  assert.equal(pubJson.includes("3500"), false);
  assert.equal(pubJson.includes("4500"), false);
  assert.equal(pubJson.includes("2000"), false);

  // Optional selective disclosure: participant 1 proves & reveals ONLY their own share
  pub = await vt.discloseMyShare(1, 4500n, salt1);
  assert.equal(pub.hasDisclosure, true);
  assert.equal(pub.disclosedSlot, 1n);
  assert.equal(pub.disclosedAmount, 4500n);
});

test("VeilTab rejects unbalanced private shares during sealAndProve", async () => {
  const vt = await new VeilTabRuntime().init();
  await vt.openTab(10000n, 2n);
  await vt.commitShare(0, 6000n, createSalt("s0"));
  await vt.commitShare(1, 3999n, createSalt("s1")); // 9999 != 10000

  await assert.rejects(
    () => vt.sealAndProve(),
    /Private shares do not sum to public tabTotal/
  );
  assert.equal(vt.getPublicLedger().state, TabState.Open);
});

test("VeilTab rejects tampered witness that does not match committed hash", async () => {
  const vt = await new VeilTabRuntime().init();
  await vt.openTab(5000n, 2n);
  await vt.commitShare(0, 2000n, createSalt("s0"));
  await vt.commitShare(1, 2000n, createSalt("s1"));

  // Tamper local private state to pretend slot 1 was 3000 (so sum = 5000) without matching commit1
  vt.privateState.shares[1] = 3000n;
  await assert.rejects(() => vt.sealAndProve(), /Share 1 mismatch/);
});

test("VeilTab enforces lifecycle, duplicate slot, bounds, and selective-disclosure proofs", async () => {
  const vt = await new VeilTabRuntime().init();

  // Invalid capacity (0 or 5) rejected
  await assert.rejects(() => vt.openTab(1000n, 0n), /Capacity must be 1..4/);
  await assert.rejects(() => vt.openTab(1000n, 5n), /Capacity must be 1..4/);

  await vt.openTab(5000n, 2n);
  // Cannot re-open
  await assert.rejects(() => vt.openTab(5000n, 2n), /Tab already opened/);

  const salt0 = createSalt("a");
  const salt1 = createSalt("b");
  await vt.commitShare(0, 2500n, salt0);

  // Duplicate commit on slot 0 rejected
  await assert.rejects(() => vt.commitShare(0, 2500n, salt0), /Slot 0 already committed/);
  // Out of bounds slot 2 rejected
  await assert.rejects(() => vt.commitShare(2, 1000n, createSalt("c")), /Slot out of bounds/);
  // Cannot seal before all participants commit
  await assert.rejects(() => vt.sealAndProve(), /Not all participants committed/);
  // Cannot disclose before Balanced
  await assert.rejects(() => vt.discloseMyShare(0, 2500n, salt0), /Tab must be balanced first/);

  await vt.commitShare(1, 2500n, salt1);
  await vt.sealAndProve();

  // Wrong amount or wrong salt on discloseMyShare rejected
  await assert.rejects(() => vt.discloseMyShare(0, 2501n, salt0), /Share 0 proof mismatch/);
  await assert.rejects(() => vt.discloseMyShare(0, 2500n, salt1), /Share 0 proof mismatch/);
});
