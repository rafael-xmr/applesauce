import { getPublicKey } from "nostr-tools";
import { SimpleSigner } from "applesauce-signer/signers/simple-signer";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

type SignerData = {
  key: string;
};

export default class SimpleAccount extends BaseAccount<"nsec", SignerData> {
  constructor(
    pubkey: string,
    override signer: SimpleSigner,
  ) {
    super(pubkey, signer);
  }

  static fromKey(key: Uint8Array | string) {
    if (typeof key === "string") key = hexToBytes(key);
    const pubkey = getPublicKey(key);
    return new SimpleAccount(pubkey, new SimpleSigner(key));
  }

  toJSON(): SerializedAccount<"nsec", SignerData> {
    return { type: "nsec", pubkey: this.pubkey, signer: { key: bytesToHex(this.signer.key) } };
  }

  static fromJSON(json: SerializedAccount<"nsec", SignerData>) {
    const key = hexToBytes(json.signer.key);
    return new SimpleAccount(json.pubkey, new SimpleSigner(key));
  }
}
