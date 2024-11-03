import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { kinds, NostrEvent } from "nostr-tools";

import { Query } from "../query-store/index.js";
import { getCoordinateFromAddressPointer, isAddressPointer } from "../helpers/pointers.js";

export function EventZapsQuery(id: string | EventPointer | AddressPointer): Query<NostrEvent[]> {
  return {
    key: JSON.stringify(id),
    run: (events) => {
      if (isAddressPointer(id)) {
        return events.timeline([{ kinds: [kinds.Zap], "#a": [getCoordinateFromAddressPointer(id)] }]);
      } else {
        id = typeof id === "string" ? id : id.id;
        return events.timeline([{ kinds: [kinds.Zap], "#e": [id] }]);
      }
    },
  };
}
