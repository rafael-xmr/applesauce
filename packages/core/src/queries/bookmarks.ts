import { kinds } from "nostr-tools";
import { map } from "rxjs/operators";

import { isHiddenTagsLocked } from "../helpers/index.js";
import { Bookmarks, getBookmarks, getHiddenBookmarks } from "../helpers/bookmarks.js";
import { Query } from "../query-store/index.js";

export function UserBookmarkQuery(pubkey: string): Query<Bookmarks | undefined> {
  return {
    key: pubkey,
    run: (store) => store.replaceable(kinds.Mutelist, pubkey).pipe(map((event) => event && getBookmarks(event))),
  };
}

export function UserHiddenBookmarkQuery(
  pubkey: string,
): Query<(Bookmarks & { locked: false }) | { locked: true } | undefined> {
  return {
    key: pubkey,
    run: (store) =>
      store.replaceable(kinds.Mutelist, pubkey).pipe(
        map((event) => {
          if (!event) return undefined;

          const bookmarks = getHiddenBookmarks(event);
          if (isHiddenTagsLocked(event) || !bookmarks) return { locked: true };
          return { locked: false, ...bookmarks };
        }),
      ),
  };
}
