import { kinds } from "nostr-tools";
import { map } from "rxjs/operators";

import { getProfileContent, ProfileContent } from "../helpers/profile.js";
import { Query } from "../query-store/index.js";

export function ProfileQuery(pubkey: string): Query<ProfileContent | undefined> {
  return {
    key: pubkey,
    run: (events) => {
      return events.replaceable(kinds.Metadata, pubkey).pipe(map((event) => event && getProfileContent(event)));
    },
  };
}
