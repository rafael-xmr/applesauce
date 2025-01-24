import { AmberClipboardSigner } from "applesauce-signer/signers/amber-clipboard-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

/** An account for the amber clipboard api */
export class AmberClipboardAccount<Metadata extends unknown> extends BaseAccount<AmberClipboardSigner, void, Metadata> {
  static type = "amber-clipboard";

  toJSON(): SerializedAccount<void, Metadata> {
    return {
      type: AmberClipboardAccount.type,
      id: this.id,
      pubkey: this.pubkey,
      metadata: this.metadata,
      signer: undefined,
    };
  }

  static fromJSON<MD extends unknown>(json: SerializedAccount<void, MD>): AmberClipboardAccount<MD> {
    return new AmberClipboardAccount(json.pubkey, new AmberClipboardSigner());
  }
}
