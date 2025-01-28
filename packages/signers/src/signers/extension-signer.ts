import { EventTemplate } from "nostr-tools";
import { Nip07Interface } from "../nip-07.js";

/** AN error that is throw when the window.nostr extension is missing */
export class ExtensionMissingError extends Error {}

/** A signer that is a proxy for window.nostr */
export class ExtensionSigner implements Nip07Interface {
  get nip04() {
    return window.nostr?.nip04;
  }
  get nip44() {
    return window.nostr?.nip44;
  }

  getPublicKey() {
    if (!window.nostr) throw new ExtensionMissingError("Signer extension missing");
    return window.nostr.getPublicKey();
  }
  getRelays() {
    if (!window.nostr) throw new ExtensionMissingError("Signer extension missing");
    if (!window.nostr.getRelays) return {};
    return window.nostr.getRelays();
  }

  signEvent(template: EventTemplate) {
    if (!window.nostr) throw new ExtensionMissingError("Signer extension missing");
    return window.nostr.signEvent(template);
  }
}
