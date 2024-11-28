import { getAddressPointerFromTag, getEventPointerFromTag, getHiddenTags } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";

export const BookmarkPublicSymbol = Symbol.for("bookmark-public");
export const BookmarkHiddenSymbol = Symbol.for("bookmark-hidden");

export type Bookmarks = {
  notes: EventPointer[];
  articles: AddressPointer[];
  hashtags: string[];
  urls: string[];
};

export function parseBookmarkTags(tags: string[][]): Bookmarks {
  const notes = tags.filter((t) => t[0] === "e" && t[1]).map(getEventPointerFromTag);
  const articles = tags
    .filter((t) => t[0] === "a" && t[1])
    .map(getAddressPointerFromTag)
    .filter((addr) => addr.kind === kinds.LongFormArticle);
  const hashtags = tags.filter((t) => t[0] === "t" && t[1]).map((t) => t[1]);
  const urls = tags.filter((t) => t[0] === "r" && t[1]).map((t) => t[1]);

  return { notes, articles, hashtags, urls };
}

/** Returns the public bookmarks of the event */
export function getBookmarks(bookmark: NostrEvent) {
  return getOrComputeCachedValue(bookmark, BookmarkPublicSymbol, () => parseBookmarkTags(bookmark.tags));
}

/** Returns the bookmarks of the event if its unlocked */
export function getHiddenBookmarks(bookmark: NostrEvent) {
  return getOrComputeCachedValue(bookmark, BookmarkHiddenSymbol, () => {
    const tags = getHiddenTags(bookmark);
    return tags && parseBookmarkTags(tags);
  });
}
