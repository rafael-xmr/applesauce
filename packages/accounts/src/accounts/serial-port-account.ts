import { SerialPortSigner } from "applesauce-signer/signers/serial-port-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

/** An account for SerialPortSigner */
export default class SerialPortAccount<Metadata extends unknown> extends BaseAccount<SerialPortSigner, void, Metadata> {
  static type = "serial-port";

  async unlock(): Promise<boolean> {
    try {
      const pubkey = await this.signer.getPublicKey();
      if (pubkey !== this.pubkey) throw new Error("Signer returned incorrect pubkey");
      return true;
    } catch (error) {
      return false;
    }
  }

  toJSON(): SerializedAccount<void, Metadata> {
    return {
      type: SerialPortAccount.type,
      id: this.id,
      pubkey: this.pubkey,
      metadata: this.metadata,
      signer: undefined,
    };
  }

  static fromJSON<Metadata extends unknown>(json: SerializedAccount<void, Metadata>): SerialPortAccount<Metadata> {
    return new SerialPortAccount(json.pubkey, new SerialPortSigner());
  }
}
