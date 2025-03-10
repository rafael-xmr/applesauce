import { NostrEvent } from "nostr-tools";
import { getHiddenContent, HiddenContentSigner, unlockHiddenContent } from "./hidden-content.js";

/** Returns the decrypted content of a direct message */
export async function decryptDirectMessage(message: NostrEvent, signer: HiddenContentSigner): Promise<string> {
  return getHiddenContent(message) || (await unlockHiddenContent(message, signer));
}
