import { Tokens } from "applesauce-content/helpers";
import { nip19 } from "nostr-tools";
import { DecodeResult } from "nostr-tools/nip19";

/** Returns all NIP-19 pointers in a content string */
export function getContentPointers(content: string) {
  const mentions = content.matchAll(Tokens.nostrLink);

  const pointers: DecodeResult[] = [];
  for (const [_, $1] of mentions) {
    try {
      const decode = nip19.decode($1);
      pointers.push(decode);
    } catch (error) {}
  }

  return pointers;
}
