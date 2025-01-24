import { ReadonlySigner } from "applesauce-signer/signers/readonly-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

/** An account that cannot sign or encrypt anything */
export class ReadonlyAccount<Metadata extends unknown> extends BaseAccount<ReadonlySigner, void, Metadata> {
  static type = "readonly";

  toJSON() {
    return {
      type: ReadonlyAccount.type,
      id: this.id,
      pubkey: this.pubkey,
      metadata: this.metadata,
      signer: undefined,
    };
  }

  static fromJSON<Metadata extends unknown>(json: SerializedAccount<void, Metadata>): ReadonlyAccount<Metadata> {
    return new ReadonlyAccount(json.pubkey, new ReadonlySigner(json.pubkey));
  }
}
