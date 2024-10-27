import { kinds, NostrEvent } from "nostr-tools";
import { Query } from "applesauce-core/query-store";
import { getTagValue } from "applesauce-core/helpers";
import { map } from "rxjs";

import { getUserStatusPointer, UserStatusPointer } from "../helpers/user-status.js";

export type UserStatus = UserStatusPointer & {
  event: NostrEvent;
  content: string;
};

/** Creates a Query that returns a parsed {@link UserStatus} for a certain type */
export function UserStatusQuery(pubkey: string, type: string = "general"): Query<UserStatus | undefined | null> {
  return {
    key: pubkey,
    run: (events) =>
      events.replaceable(kinds.UserStatuses, pubkey, type).pipe(
        map((event) => {
          if (!event) return undefined;

          const pointer = getUserStatusPointer(event);
          if (!pointer) return null;

          return {
            ...pointer,
            event,
            content: event.content,
          };
        }),
      ),
  };
}

/** Creates a Query that returns a directory of parsed {@link UserStatus} for a pubkey */
export function UserStatusesQuery(pubkey: string): Query<Record<string, UserStatus>> {
  return {
    key: pubkey,
    run: (events) =>
      events.timeline([{ kinds: [kinds.UserStatuses], authors: [pubkey] }]).pipe(
        map((events) => {
          return events.reduce((dir, event) => {
            const d = getTagValue(event, "d");
            if (!d) return dir;

            return { ...dir, [d]: { event, ...getUserStatusPointer(event), content: event.content } };
          }, {});
        }),
      ),
  };
}
