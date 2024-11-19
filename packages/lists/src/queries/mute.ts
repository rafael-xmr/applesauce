import { kinds } from "nostr-tools";
import { Query } from "applesauce-core";
import { map } from "rxjs/operators";
import { isHiddenTagsLocked } from "applesauce-core/helpers";

import { getHiddenMutedThings, getMutedThings, Mutes } from "../helpers/mute.js";

export function UserMuteQuery(pubkey: string): Query<Mutes | undefined> {
  return {
    key: pubkey,
    run: (store) => store.replaceable(kinds.Mutelist, pubkey).pipe(map((event) => event && getMutedThings(event))),
  };
}

export function UserHiddenMuteQuery(pubkey: string): Query<(Mutes & { locked: false }) | { locked: true } | undefined> {
  return {
    key: pubkey,
    run: (store) =>
      store.replaceable(kinds.Mutelist, pubkey).pipe(
        map((event) => {
          if (!event) return undefined;

          const muted = getHiddenMutedThings(event);
          if (isHiddenTagsLocked(event) || !muted) return { locked: true };
          return { locked: false, ...muted };
        }),
      ),
  };
}
