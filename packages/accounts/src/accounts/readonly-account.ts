import { ReadonlySigner } from "applesauce-signer/signers/readonly-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

/** An account that cannot sign or encrypt anything */
export default class ReadonlyAccount extends BaseAccount<"readonly", void> {
  constructor(pubkey: string, signer?: ReadonlySigner) {
    super(pubkey, signer || new ReadonlySigner(pubkey));
  }

  toJSON(): SerializedAccount<"readonly", void> {
    return {
      type: "readonly",
      pubkey: this.pubkey,
      signer: undefined,
    };
  }

  static fromJSON(json: SerializedAccount<"readonly", void>) {
    return new ReadonlyAccount(json.pubkey);
  }
}
