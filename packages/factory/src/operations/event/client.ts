import { AddressPointer } from "nostr-tools/nip19";
import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { EventOperation } from "../../event-factory.js";
import { includeSingletonTag } from "./tags.js";
import { fillAndTrimTag } from "../../helpers/tag.js";

// A list of event kinds to never attach the "client" tag to
const NEVER_ATTACH_CLIENT_TAG = [kinds.EncryptedDirectMessage, kinds.GiftWrap];

export function includeClientTag(name: string, pointer?: Omit<AddressPointer, "kind" | "relays">): EventOperation {
  return (draft, ctx) => {
    if (NEVER_ATTACH_CLIENT_TAG.includes(draft.kind)) return draft;
    else {
      const coordinate = pointer
        ? getCoordinateFromAddressPointer({
            pubkey: pointer.pubkey,
            identifier: pointer.identifier,
            kind: kinds.Handlerinformation,
          })
        : undefined;

      return includeSingletonTag(fillAndTrimTag(["client", name, coordinate]) as [string, ...string[]])(draft, ctx);
    }
  };
}
