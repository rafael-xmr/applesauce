import { Nip07Interface } from "applesauce-signer";

export type SerializedAccount<T extends string, S> = {
  type: T;
  name?: string;
  pubkey: string;
  signer: S;
};

export interface IAccount<T extends string, S> extends Nip07Interface {
  name?: string;
  pubkey: string;

  locked: boolean;
  unlock(): Promise<boolean>;
  lock(): void;

  toJSON(): SerializedAccount<T, S>;
}

export interface IAccountConstructor<T extends string, S> {
  new (pubkey: string, signer: Nip07Interface): IAccount<T, S>;
  fromJSON(json: SerializedAccount<T, S>): IAccount<T, S>;
}
