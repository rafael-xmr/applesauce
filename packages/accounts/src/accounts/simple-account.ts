import { getPublicKey } from "nostr-tools";
import { SimpleSigner } from "applesauce-signers/signers/simple-signer";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

export type SimpleAccountSignerData = {
  key: string;
};

export class SimpleAccount<Metadata extends unknown> extends BaseAccount<
  SimpleSigner,
  SimpleAccountSignerData,
  Metadata
> {
  static type = "nsec";

  toJSON(): SerializedAccount<SimpleAccountSignerData, Metadata> {
    return {
      type: SimpleAccount.type,
      id: this.id,
      pubkey: this.pubkey,
      metadata: this.metadata,
      signer: { key: bytesToHex(this.signer.key) },
    };
  }

  static fromJSON<Metadata extends unknown>(
    json: SerializedAccount<SimpleAccountSignerData, Metadata>,
  ): SimpleAccount<Metadata> {
    const key = hexToBytes(json.signer.key);
    const account = new SimpleAccount<Metadata>(json.pubkey, new SimpleSigner(key));
    return super.loadCommonFields(account, json);
  }

  static fromKey<Metadata extends unknown>(key: Uint8Array | string): SimpleAccount<Metadata> {
    if (typeof key === "string") key = hexToBytes(key);
    const pubkey = getPublicKey(key);
    return new SimpleAccount(pubkey, new SimpleSigner(key));
  }
}
