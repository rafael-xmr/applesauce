import { kinds } from "nostr-tools";
import { Query } from "applesauce-core";
import { map } from "rxjs/operators";

import { getContactsPeople } from "../helpers/contacts.js";
import { ProfilePointer } from "nostr-tools/nip19";

export function UserContactsQuery(pubkey: string): Query<ProfilePointer[] | undefined> {
  return {
    key: pubkey,
    run: (store) => store.replaceable(kinds.Mutelist, pubkey).pipe(map((event) => event && getContactsPeople(event))),
  };
}
