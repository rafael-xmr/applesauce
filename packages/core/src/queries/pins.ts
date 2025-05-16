import { kinds } from "nostr-tools";
import { Query } from "applesauce-core";
import { EventPointer } from "nostr-tools/nip19";
import { map } from "rxjs/operators";

import { isETag, processTags } from "../helpers/tags.js";
import { getEventPointerFromETag } from "../helpers/pointers.js";

/** A query that returns all pinned pointers for a user */
export function UserPinnedQuery(pubkey: string): Query<EventPointer[] | undefined> {
  return (events) =>
    events
      .replaceable(kinds.Pinlist, pubkey)
      .pipe(map((event) => event && processTags(event.tags.filter(isETag), getEventPointerFromETag)));
}
