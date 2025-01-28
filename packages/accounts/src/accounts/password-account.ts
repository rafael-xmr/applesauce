import { PasswordSigner } from "applesauce-signers/signers/password-signer";
import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

export type PasswordAccountSignerData = {
  ncryptsec: string;
};

export class PasswordAccount<Metadata extends unknown> extends BaseAccount<
  PasswordSigner,
  PasswordAccountSignerData,
  Metadata
> {
  static readonly type = "ncryptsec";

  get unlocked() {
    return this.signer.unlocked;
  }

  /** called when PasswordAccount.unlock is called without a password */
  static async requestUnlockPassword(_account: PasswordAccount<any>): Promise<string> {
    throw new Error(
      "Cant unlock PasswordAccount without a password. either pass one in or set PasswordAccount.requestUnlockPassword",
    );
  }

  /**
   * Attempt to unlock the signer with a password
   * @throws
   */
  async unlock(password?: string) {
    password = password || (await PasswordAccount.requestUnlockPassword(this));
    await this.signer.unlock(password);
  }

  toJSON(): SerializedAccount<PasswordAccountSignerData, Metadata> {
    if (!this.signer.ncryptsec) throw new Error("Cant save account without ncryptsec");

    return super.saveCommonFields({
      signer: { ncryptsec: this.signer.ncryptsec },
    });
  }

  static fromJSON<Metadata extends unknown>(
    json: SerializedAccount<PasswordAccountSignerData, Metadata>,
  ): PasswordAccount<Metadata> {
    const signer = new PasswordSigner();
    signer.ncryptsec = json.signer.ncryptsec;
    const account = new PasswordAccount<Metadata>(json.pubkey, signer);
    return super.loadCommonFields(account, json);
  }

  /** Creates a new PasswordAccount from a ncryptsec string */
  static fromNcryptsec<Metadata extends unknown>(pubkey: string, ncryptsec: string): PasswordAccount<Metadata> {
    const signer = new PasswordSigner();
    signer.ncryptsec = ncryptsec;
    return new PasswordAccount(pubkey, signer);
  }
}
