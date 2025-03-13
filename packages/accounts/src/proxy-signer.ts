import { Nip07Interface } from "applesauce-signers";
import { EventTemplate, NostrEvent } from "nostr-tools";
import { BehaviorSubject } from "rxjs";

export class ProxySigner<T extends Nip07Interface> implements Nip07Interface {
  nip04: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
  nip44: {
    encrypt: (pubkey: string, plaintext: string) => Promise<string> | string;
    decrypt: (pubkey: string, ciphertext: string) => Promise<string> | string;
  };
  constructor(
    protected upstream: BehaviorSubject<T | undefined>,
    protected error?: string,
  ) {
    this.nip04 = {
      encrypt: (pubkey, plaintext) => {
        if (!this.signer.nip04) throw new Error("Signer does not support nip04");
        return this.signer.nip04.encrypt(pubkey, plaintext);
      },
      decrypt: (pubkey, ciphertext) => {
        if (!this.signer.nip04) throw new Error("Signer does not support nip04");
        return this.signer.nip04.decrypt(pubkey, ciphertext);
      },
    };

    this.nip44 = {
      encrypt: (pubkey, plaintext) => {
        if (!this.signer.nip44) throw new Error("Signer does not support nip44");
        return this.signer.nip44.encrypt(pubkey, plaintext);
      },
      decrypt: (pubkey, ciphertext) => {
        if (!this.signer.nip44) throw new Error("Signer does not support nip44");
        return this.signer.nip44.decrypt(pubkey, ciphertext);
      },
    };
  }

  protected get signer(): Nip07Interface {
    if (!this.upstream.value) throw new Error(this.error || "Missing signer");
    return this.upstream.value;
  }

  signEvent(template: EventTemplate): Promise<NostrEvent> | NostrEvent {
    return this.signer.signEvent(template);
  }
  getPublicKey(): Promise<string> | string {
    return this.signer.getPublicKey();
  }
}
