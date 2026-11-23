import crypto from "node:crypto";
import {
  createCircuitContext,
  createConstructorContext,
  sampleContractAddress,
  sampleUserAddress,
} from "@midnight-ntwrk/compact-runtime";
import { Contract, TabState, ledger } from "../contracts/managed/veiltab/contract/index.js";

export { TabState };

const ZERO_SALT = new Uint8Array(32);

export function createSalt(seed = null) {
  if (seed !== null) {
    return new Uint8Array(crypto.createHash("sha256").update(String(seed)).digest());
  }
  return new Uint8Array(crypto.randomBytes(32));
}

export function toHex(bytes) {
  return "0x" + Buffer.from(bytes).toString("hex");
}

function makeWitnesses() {
  return {
    localShare0: ({ privateState }) => [privateState, BigInt(privateState.shares[0] ?? 0n)],
    localSalt0: ({ privateState }) => [privateState, privateState.salts[0] ?? ZERO_SALT],
    localShare1: ({ privateState }) => [privateState, BigInt(privateState.shares[1] ?? 0n)],
    localSalt1: ({ privateState }) => [privateState, privateState.salts[1] ?? ZERO_SALT],
    localShare2: ({ privateState }) => [privateState, BigInt(privateState.shares[2] ?? 0n)],
    localSalt2: ({ privateState }) => [privateState, privateState.salts[2] ?? ZERO_SALT],
    localShare3: ({ privateState }) => [privateState, BigInt(privateState.shares[3] ?? 0n)],
    localSalt3: ({ privateState }) => [privateState, privateState.salts[3] ?? ZERO_SALT],
  };
}

/**
 * Runs the real compiled Midnight Compact 0.36.1 VeilTab contract locally
 * using @midnight-ntwrk/compact-runtime@0.21.0 with strict public/private state separation.
 */
export class VeilTabRuntime {
  constructor() {
    this.contract = new Contract(makeWitnesses());
    this.contractAddress = sampleContractAddress();
    this.caller = sampleUserAddress();
    this.privateState = {
      shares: [0n, 0n, 0n, 0n],
      salts: [ZERO_SALT, ZERO_SALT, ZERO_SALT, ZERO_SALT],
    };
    this.contractState = null;
  }

  async init() {
    const ctorCtx = createConstructorContext(this.privateState, this.caller);
    const res = await this.contract.initialState(ctorCtx);
    this.contractState = res.currentContractState;
    this.privateState = res.currentPrivateState;
    return this;
  }

  _circuitCtx(circuitId) {
    if (!this.contractState) throw new Error("VeilTabRuntime not initialized");
    return createCircuitContext({
      circuitId,
      contractAddress: this.contractAddress,
      coinPublicKeyOrZswapState: this.caller,
      contractState: this.contractState.data,
      privateState: this.privateState,
    });
  }

  _applyResult(res) {
    this.contractState.data = res.context.callContext.currentQueryContext.state;
    this.privateState = res.context.callContext.currentPrivateState;
  }

  getPublicLedger() {
    const raw = ledger(this.contractState.data);
    return {
      tabTotal: raw.tabTotal,
      capacity: raw.capacity,
      commitmentCount: raw.commitmentCount,
      state: raw.state,
      stateName: TabState[raw.state] ?? "Unknown",
      commitments: [toHex(raw.commit0), toHex(raw.commit1), toHex(raw.commit2), toHex(raw.commit3)],
      hasDisclosure: raw.hasDisclosure,
      disclosedSlot: raw.disclosedSlot,
      disclosedAmount: raw.disclosedAmount,
    };
  }

  getPrivateSummary() {
    return {
      shares: this.privateState.shares.map((s) => s.toString()),
      salts: this.privateState.salts.map((b) => toHex(b)),
    };
  }

  async openTab(totalCents, participantCount) {
    const res = await this.contract.impureCircuits.openTab(
      this._circuitCtx("openTab"),
      BigInt(totalCents),
      BigInt(participantCount)
    );
    this._applyResult(res);
    return this.getPublicLedger();
  }

  async commitShare(slot, shareCents, salt = createSalt()) {
    const idx = Number(slot);
    const amt = BigInt(shareCents);
    const res = await this.contract.impureCircuits.commitShare(
      this._circuitCtx("commitShare"),
      BigInt(idx),
      amt,
      salt
    );
    this._applyResult(res);
    if (idx >= 0 && idx < 4) {
      this.privateState.shares[idx] = amt;
      this.privateState.salts[idx] = salt;
    }
    return this.getPublicLedger();
  }

  async sealAndProve() {
    const res = await this.contract.impureCircuits.sealAndProve(
      this._circuitCtx("sealAndProve")
    );
    this._applyResult(res);
    return this.getPublicLedger();
  }

  async discloseMyShare(slot, shareCents, salt) {
    const res = await this.contract.impureCircuits.discloseMyShare(
      this._circuitCtx("discloseMyShare"),
      BigInt(slot),
      BigInt(shareCents),
      salt
    );
    this._applyResult(res);
    return this.getPublicLedger();
  }
}
