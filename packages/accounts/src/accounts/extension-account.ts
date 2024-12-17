import { ExtensionSigner } from "applesauce-signer/signers/extension-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

export default class ExtensionAccount extends BaseAccount<"extension", void> {
  constructor(pubkey: string) {
    super(pubkey, new ExtensionSigner());
  }

  toJSON(): SerializedAccount<"extension", void> {
    return { type: "extension", pubkey: this.pubkey, signer: undefined };
  }

  static fromJSON(json: SerializedAccount<"extension", void>): ExtensionAccount {
    return new ExtensionAccount(json.pubkey);
  }
}
