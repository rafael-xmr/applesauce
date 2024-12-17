import { AmberClipboardSigner } from "applesauce-signer/signers/amber-clipboard-signer";
import { BaseAccount } from "../account.js";
import { IAccount, SerializedAccount } from "../types.js";

/** An account for the amber clipboard api */
export class AmberClipboardAccount extends BaseAccount<"amber-clipboard", void> {
  constructor(
    pubkey: string,
    override signer: AmberClipboardSigner,
  ) {
    super(pubkey, signer);
  }

  toJSON(): SerializedAccount<"amber-clipboard", void> {
    return { type: "amber-clipboard", pubkey: this.pubkey, name: this.name, signer: void 0 };
  }

  static fromJSON(json: SerializedAccount<"amber-clipboard", void>): IAccount<"amber-clipboard", void> {
    return new AmberClipboardAccount(json.pubkey, new AmberClipboardSigner());
  }
}
