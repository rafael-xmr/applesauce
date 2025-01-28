import { ExtensionSigner } from "applesauce-signers/signers/extension-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

export class ExtensionAccount<Metadata extends unknown> extends BaseAccount<ExtensionSigner, void, Metadata> {
  static type = "extension";

  constructor(
    pubkey: string,
    override signer: ExtensionSigner,
  ) {
    super(pubkey, signer || new ExtensionSigner());
  }

  toJSON() {
    return {
      type: ExtensionAccount.type,
      id: this.id,
      pubkey: this.pubkey,
      metadata: this.metadata,
      signer: undefined,
    };
  }

  static fromJSON<MD extends unknown>(json: SerializedAccount<void, MD>) {
    return new ExtensionAccount(json.pubkey, new ExtensionSigner());
  }
}
