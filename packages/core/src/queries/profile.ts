import { kinds } from "nostr-tools";
import { filter, map } from "rxjs/operators";

import { getProfileContent, isValidProfile, ProfileContent } from "../helpers/profile.js";
import { Query } from "../query-store/index.js";

/** A query that gets and parses the kind 0 metadata for a pubkey */
export function ProfileQuery(pubkey: string): Query<ProfileContent | undefined> {
  return {
    key: pubkey,
    run: (events) => {
      return events.replaceable(kinds.Metadata, pubkey).pipe(
        filter(isValidProfile),
        map((event) => event && getProfileContent(event)),
      );
    },
  };
}
