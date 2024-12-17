import { SerialPortSigner } from "applesauce-signer/signers/serial-port-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

/** An account for SerialPortSigner */
export default class SerialPortAccount extends BaseAccount<"serial-port", void> {
  constructor(pubkey: string, signer?: SerialPortSigner) {
    super(pubkey, signer || new SerialPortSigner());
  }

  async unlock(): Promise<boolean> {
    try {
      const pubkey = await this.signer.getPublicKey();
      if (pubkey !== this.pubkey) throw new Error("Signer returned incorrect pubkey");
      return true;
    } catch (error) {
      return false;
    }
  }

  toJSON(): SerializedAccount<"serial-port", void> {
    return { type: "serial-port", pubkey: this.pubkey, signer: undefined };
  }

  static fromJSON(json: SerializedAccount<"serial-port", void>) {
    return new SerialPortAccount(json.pubkey);
  }
}
