import { Nip07Interface } from "applesauce-signer";
import { nanoid } from "nanoid";

import { EventTemplate, IAccount, SerializedAccount } from "./types.js";
import { BehaviorSubject } from "rxjs";
import { NostrEvent } from "nostr-tools";

export class SignerMismatchError extends Error {}

export class BaseAccount<Signer extends Nip07Interface, SignerData, Metadata extends unknown>
  implements IAccount<Signer, SignerData, Metadata>
{
  id = nanoid(8);

  /** Use a queue for sign and encryption/decryption requests so that there is only one request at a time */
  queueRequests = true;

  metadata$ = new BehaviorSubject<Metadata | undefined>(undefined);
  get metadata(): Metadata | undefined {
    return this.metadata$.value;
  }
  set metadata(metadata: Metadata) {
    this.metadata$.next(metadata);
  }

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
          return this.waitForLock(() => this.signer.nip04!.encrypt(pubkey, plaintext));
        },
        decrypt: (pubkey, plaintext) => {
          return this.waitForLock(() => this.signer.nip04!.decrypt(pubkey, plaintext));
        },
      };
    }

    if (this.signer.nip44) {
      this.nip44 = {
        encrypt: (pubkey, plaintext) => {
          return this.waitForLock(() => this.signer.nip44!.encrypt(pubkey, plaintext));
        },
        decrypt: (pubkey, plaintext) => {
          return this.waitForLock(() => this.signer.nip44!.decrypt(pubkey, plaintext));
        },
      };
    }
  }

  // This should be overwritten by a sub class
  toJSON(): SerializedAccount<SignerData, Metadata> {
    throw new Error("Not implemented");
  }

  /** Gets the pubkey from the signer */
  getPublicKey(): string | Promise<string> {
    const result = this.signer.getPublicKey();

    if (result instanceof Promise)
      return result.then((pubkey) => {
        if (this.pubkey !== pubkey) throw new SignerMismatchError("Account signer mismatch");
        return pubkey;
      });
    else {
      if (this.pubkey !== result) throw new SignerMismatchError("Account signer mismatch");
      return result;
    }
  }

  /** sign the event and make sure its signed with the correct pubkey */
  signEvent(template: EventTemplate): Promise<NostrEvent> | NostrEvent {
    if (!Reflect.has(template, "pubkey")) Reflect.set(template, "pubkey", this.pubkey);

    return this.waitForLock(() => {
      const result = this.signer.signEvent(template);

      if (result instanceof Promise)
        return result.then((signed) => {
          if (signed.pubkey !== this.pubkey) throw new SignerMismatchError("Signer signed with wrong pubkey");
          return signed;
        });
      else {
        if (result.pubkey !== this.pubkey) throw new SignerMismatchError("Signer signed with wrong pubkey");

        return result;
      }
    });
  }

  /** Resets the request queue */
  resetQueue() {
    this.lock = null;
    this.queueLength = 0;
  }

  /** internal queue */
  protected queueLength = 0;
  protected lock: Promise<any> | null = null;
  protected waitForLock<T>(fn: () => Promise<T> | T): Promise<T> | T {
    if (!this.queueRequests) return fn();

    // if there is already a pending request, wait for it
    if (this.lock) {
      // create a new promise that runs after the lock
      const p = this.lock
        .then(() => fn())
        .finally(() => {
          // shorten the queue
          this.queueLength--;

          // if this was the last request, remove the lock
          if (this.queueLength === 0) this.lock = null;
        });

      // set the lock the new promise
      this.lock = p;
      this.queueLength++;

      return p;
    } else {
      const result = fn();

      // if the result is async, set the new lock
      if (result instanceof Promise) {
        this.lock = result;
        this.queueLength = 1;
      }

      return result;
    }
  }
}
