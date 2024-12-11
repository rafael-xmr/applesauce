import { Expressions } from "applesauce-content/helpers";
import { nip19 } from "nostr-tools";
import { DecodeResult } from "nostr-tools/nip19";

export function getContentPointers(content: string) {
  const mentions = content.matchAll(Expressions.nostrLink);

  const pointers: DecodeResult[] = [];
  for (const [_, $1] of mentions) {
    try {
      const decode = nip19.decode($1);
      pointers.push(decode);
    } catch (error) {}
  }

  return pointers;
}
