import { NostrConnectConnectionMethods, NostrConnectSigner, SimpleSigner } from "applesauce-signers";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";

import { BaseAccount } from "../account.js";
import { SerializedAccount } from "../types.js";

type SignerData = {
  clientKey: string;
  remote: string;
  relays: string[];
};

/** An account type for NIP-46 signers */
export class NostrConnectAccount<Metadata extends unknown> extends BaseAccount<
  NostrConnectSigner,
  SignerData,
  Metadata
> {
  static type = "nostr-connect";

  toJSON(): SerializedAccount<SignerData, Metadata> {
    if (!this.signer.remote) throw new Error("Cant save NostrConnectAccount when not initialized");

    const signer: SignerData = {
      clientKey: bytesToHex(this.signer.signer.key),
      remote: this.signer.remote,
      relays: this.signer.relays,
    };

    return { type: NostrConnectAccount.type, id: this.id, pubkey: this.pubkey, metadata: this.metadata, signer };
  }

  /** This is called when NostrConnectAccount.fromJSON needs new connection methods for NostrConnectSigner */
  static createConnectionMethods(): NostrConnectConnectionMethods {
    throw new Error(
      "Cant create NostrConnectAccount without either passing in connection methods or setting NostrConnectAccount.createConnectionMethods",
    );
  }

  static fromJSON<Metadata extends unknown>(
    json: SerializedAccount<SignerData, Metadata>,
    connection?: NostrConnectConnectionMethods,
  ): NostrConnectAccount<Metadata> {
    connection = connection || NostrConnectAccount.createConnectionMethods();
    const signer = new NostrConnectSigner({
      ...connection,
      relays: json.signer.relays,
      pubkey: json.pubkey,
      remote: json.signer.remote,
      signer: new SimpleSigner(hexToBytes(json.signer.clientKey)),
    });

    const account = new NostrConnectAccount<Metadata>(json.pubkey, signer);
    return super.loadCommonFields(account, json);
  }
}
