import { Nip07Interface } from "applesauce-signers";

export type EventTemplate = {
  kind: number;
  content: string;
  tags: string[][];
  created_at: number;
};

export type SerializedAccount<SignerData, Metadata extends unknown> = {
  /** Internal account ID */
  id: string;
  /** account type */
  type: string;
  /** pubkey of the account */
  pubkey: string;
  /** Signer data */
  signer: SignerData;
  /** Extra application specific account metadata */
  metadata?: Metadata;
};

export interface IAccount<Signer extends Nip07Interface, SignerData, Metadata extends unknown> extends Nip07Interface {
  id: string;
  name?: string;
  pubkey: string;
  metadata?: Metadata;
  signer: Signer;

  disableQueue?: boolean;

  toJSON(): SerializedAccount<SignerData, Metadata>;
}

export interface IAccountConstructor<Signer extends Nip07Interface, SignerData, Metadata extends unknown> {
  type: string;
  new (pubkey: string, signer: Signer): IAccount<Signer, SignerData, Metadata>;
  fromJSON(json: SerializedAccount<SignerData, Metadata>): IAccount<Signer, SignerData, Metadata>;
}
