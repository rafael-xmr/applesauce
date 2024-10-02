import { kinds } from "nostr-tools";
import { Query } from "applesauce-core";

import { isHiddenTagsLocked } from "../helpers/hidden.js";
import { Bookmarks, getBookmarks, getHiddenBookmarks } from "../helpers/bookmark.js";

export function UserBookmarkQuery(pubkey: string): Query<Bookmarks | undefined> {
  return {
    key: pubkey,
    run: (store) => store.replaceable(kinds.Mutelist, pubkey).map((event) => event && getBookmarks(event)),
  };
}

export function UserHiddenBookmarkQuery(
  pubkey: string,
): Query<(Bookmarks & { locked: false }) | { locked: true } | undefined> {
  return {
    key: pubkey,
    run: (store) =>
      store.replaceable(kinds.Mutelist, pubkey).map((event) => {
        if (!event) return undefined;

        const bookmarks = getHiddenBookmarks(event);
        if (isHiddenTagsLocked(event) || !bookmarks) return { locked: true };
        return { locked: false, ...bookmarks };
      }),
  };
}
