import { Nip07Interface } from "applesauce-signer";
import { nanoid } from "nanoid";

import { EventTemplate, IAccount, SerializedAccount } from "./types.js";

// errors
export class SignerMismatchError extends Error {}
export class AccountLockedError extends Error {}

export class BaseAccount<Signer extends Nip07Interface, SignerData, Metadata extends unknown>
  implements IAccount<Signer, SignerData, Metadata>
{
  id = nanoid(8);
  metadata?: Metadata;

  // encryption interfaces
  nip04?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;
  nip44?:
    | {
        encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
        decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
      }
    | undefined;

  constructor(
    public pubkey: string,
    public signer: Signer,
  ) {
    // setup encryption interfaces to check if account is locked
    if (this.signer.nip04) {
      this.nip04 = {
        encrypt: (pubkey, plaintext) => {
          return this.signer.nip04!.encrypt(pubkey, plaintext);
        },
        decrypt: (pubkey, plaintext) => {
          return this.signer.nip04!.decrypt(pubkey, plaintext);
        },
      };
    }

    if (this.signer.nip44) {
      this.nip44 = {
        encrypt: (pubkey, plaintext) => {
          return this.signer.nip44!.encrypt(pubkey, plaintext);
        },
        decrypt: (pubkey, plaintext) => {
          return this.signer.nip44!.decrypt(pubkey, plaintext);
        },
      };
    }
  }

  // This should be overwritten by a sub class
  toJSON(): SerializedAccount<SignerData, Metadata> {
    throw new Error("Not implemented");
  }

  /** Gets the pubkey from the signer */
  async getPublicKey() {
    // this.checkLocked();
    const signerKey = await this.signer.getPublicKey();
    if (this.pubkey !== signerKey) throw new Error("Account signer mismatch");
    return this.pubkey;
  }

  /** sign the event and make sure its signed with the correct pubkey */
  async signEvent(template: EventTemplate) {
    // this.checkLocked();
    if (!Reflect.has(template, "pubkey")) Reflect.set(template, "pubkey", this.pubkey);

    const signed = await this.signer.signEvent(template);
    if (signed.pubkey !== this.pubkey) throw new SignerMismatchError("Signer signed with wrong pubkey");

    return signed;
  }
}
