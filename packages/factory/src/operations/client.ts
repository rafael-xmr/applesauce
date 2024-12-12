import { AddressPointer } from "nostr-tools/nip19";
import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";

import { EventFactoryOperation } from "../event-factory.js";
import { includeSingletonTag } from "./tags.js";

// A list of event kinds to never attach the "client" tag to
const NEVER_ATTACH_CLIENT_TAG = [kinds.EncryptedDirectMessage, kinds.GiftWrap];

export function includeClientTag(name: string, pointer?: AddressPointer): EventFactoryOperation {
  return (draft, ctx) => {
    if (NEVER_ATTACH_CLIENT_TAG.includes(draft.kind)) return draft;
    else
      return includeSingletonTag(
        pointer ? ["client", name, getCoordinateFromAddressPointer(pointer)] : ["client", name],
      )(draft, ctx);
  };
}
