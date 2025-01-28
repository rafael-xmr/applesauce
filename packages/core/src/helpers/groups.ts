import { NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";
import { processTags } from "./tags.js";
import { getHiddenTags } from "./hidden-tags.js";

export const GROUPS_LIST_KIND = 10009;
export const GROUP_MESSAGE_KIND = 9;

/** NIP-29 group pointer */
export type GroupPointer = {
  id: string;
  relay: string;
  name?: string;
};

/**
 * decodes a group identifier into a group pointer object
 * @throws
 */
export function decodeGroupPointer(str: string): GroupPointer {
  const [relay, id] = str.split("'");
  if (!relay) throw new Error("Group pointer missing relay");

  return { relay, id: id || "_" };
}

/** Converts a group pointer into a group identifier */
export function encodeGroupPointer(pointer: GroupPointer) {
  const hostname = URL.canParse(pointer.relay) ? new URL(pointer.relay).hostname : pointer.relay;

  return `${hostname}'${pointer.id}`;
}

export const GroupsPublicSymbol = Symbol.for("groups-public");
export const GroupsHiddenSymbol = Symbol.for("groups-hidden");

/** gets a {@link GroupPointer} from a "group" tag */
export function getGroupPointerFromGroupTag(tag: string[]): GroupPointer {
  const [_, id, relay, name] = tag;
  return { id, relay, name };
}

/** Returns all the public groups from a k:10009 list */
export function getPublicGroups(bookmark: NostrEvent): GroupPointer[] {
  return getOrComputeCachedValue(bookmark, GroupsPublicSymbol, () =>
    processTags(
      bookmark.tags.filter((t) => t[0] === "group"),
      getGroupPointerFromGroupTag,
    ),
  );
}

/** Returns all the hidden groups from a k:10009 list */
export function getHiddenGroups(bookmark: NostrEvent): GroupPointer[] | undefined {
  return getOrComputeCachedValue(bookmark, GroupsHiddenSymbol, () => {
    const tags = getHiddenTags(bookmark);
    return (
      tags &&
      processTags(
        bookmark.tags.filter((t) => t[0] === "group"),
        getGroupPointerFromGroupTag,
      )
    );
  });
}
