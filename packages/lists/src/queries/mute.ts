import { kinds } from "nostr-tools";
import { Query } from "applesauce-core";

import { getHiddenMutedThings, getMutedThings, Mutes } from "../helpers/mute.js";
import { isHiddenTagsLocked } from "../helpers/hidden.js";

export function UserMuteQuery(pubkey: string): Query<Mutes | undefined> {
  return {
    key: pubkey,
    run: (store) => store.replaceable(kinds.Mutelist, pubkey).map((event) => event && getMutedThings(event)),
  };
}

export function UserHiddenMuteQuery(pubkey: string): Query<(Mutes & { locked: false }) | { locked: true } | undefined> {
  return {
    key: pubkey,
    run: (store) =>
      store.replaceable(kinds.Mutelist, pubkey).map((event) => {
        if (!event) return undefined;

        const muted = getHiddenMutedThings(event);
        if (isHiddenTagsLocked(event) || !muted) return { locked: true };
        return { locked: false, ...muted };
      }),
  };
}
