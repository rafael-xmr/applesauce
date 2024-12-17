import { PasswordSigner } from "applesauce-signer/signers/password-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

type SignerData = {
  ncryptsec: string;
};

export default class PasswordAccount extends BaseAccount<"ncryptsec", SignerData> {
  constructor(
    pubkey: string,
    override signer: PasswordSigner,
  ) {
    super(pubkey, signer);
  }

  async unlock(): Promise<boolean> {
    try {
      const password = prompt("Unlock password");
      if (password === null) return false;
      await this.signer.unlock(password);
      return true;
    } catch (error) {
      return false;
    }
  }

  toJSON(): SerializedAccount<"ncryptsec", SignerData> {
    if (!this.signer.ncryptsec) throw new Error("Cant save account without ncryptsec");

    return { type: "ncryptsec", pubkey: this.pubkey, signer: { ncryptsec: this.signer.ncryptsec } };
  }

  static fromJSON(json: SerializedAccount<"ncryptsec", SignerData>) {
    const signer = new PasswordSigner();
    signer.ncryptsec = json.signer.ncryptsec;
    return new PasswordAccount(json.pubkey, signer);
  }

  static fromNcryptsec(pubkey: string, ncryptsec: string) {
    const signer = new PasswordSigner();
    signer.ncryptsec = ncryptsec;
    return new PasswordAccount(pubkey, signer);
  }
}
