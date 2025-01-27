import { kinds } from "nostr-tools";
import { map } from "rxjs/operators";
import { ProfilePointer } from "nostr-tools/nip19";

import { isPTag, processTags } from "../helpers/tags.js";
import { getProfilePointerFromPTag } from "../helpers/pointers.js";
import { Query } from "../query-store/index.js";

export function UserContactsQuery(pubkey: string): Query<ProfilePointer[] | undefined> {
  return {
    key: pubkey,
    run: (store) =>
      store
        .replaceable(kinds.Mutelist, pubkey)
        .pipe(map((event) => event && processTags(event.tags.filter(isPTag), getProfilePointerFromPTag))),
  };
}
