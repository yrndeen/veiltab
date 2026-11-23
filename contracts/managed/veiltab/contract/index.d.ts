import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum TabState { Unopened = 0, Open = 1, Balanced = 2 }

export type Witnesses<PS> = {
  localShare0(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  localSalt0(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localShare1(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  localSalt1(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localShare2(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  localSalt2(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  localShare3(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, bigint];
  localSalt3(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  openTab(context: __compactRuntime.CircuitContext<PS>,
          total_0: bigint,
          participantCount_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  commitShare(context: __compactRuntime.CircuitContext<PS>,
              slot_0: bigint,
              shareAmount_0: bigint,
              shareSalt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  sealAndProve(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  discloseMyShare(context: __compactRuntime.CircuitContext<PS>,
                  slot_0: bigint,
                  shareAmount_0: bigint,
                  shareSalt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  openTab(context: __compactRuntime.CircuitContext<PS>,
          total_0: bigint,
          participantCount_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  commitShare(context: __compactRuntime.CircuitContext<PS>,
              slot_0: bigint,
              shareAmount_0: bigint,
              shareSalt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  sealAndProve(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  discloseMyShare(context: __compactRuntime.CircuitContext<PS>,
                  slot_0: bigint,
                  shareAmount_0: bigint,
                  shareSalt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  openTab(context: __compactRuntime.CircuitContext<PS>,
          total_0: bigint,
          participantCount_0: bigint): Promise<__compactRuntime.CircuitResults<PS, []>>;
  commitShare(context: __compactRuntime.CircuitContext<PS>,
              slot_0: bigint,
              shareAmount_0: bigint,
              shareSalt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  sealAndProve(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, []>>;
  discloseMyShare(context: __compactRuntime.CircuitContext<PS>,
                  slot_0: bigint,
                  shareAmount_0: bigint,
                  shareSalt_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  readonly tabTotal: bigint;
  readonly capacity: bigint;
  readonly commitmentCount: bigint;
  readonly state: TabState;
  readonly commit0: Uint8Array;
  readonly commit1: Uint8Array;
  readonly commit2: Uint8Array;
  readonly commit3: Uint8Array;
  readonly disclosedSlot: bigint;
  readonly disclosedAmount: bigint;
  readonly hasDisclosure: boolean;
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
