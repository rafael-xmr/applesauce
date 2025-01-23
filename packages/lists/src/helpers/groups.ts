import { getHiddenTags, getOrComputeCachedValue, processTags } from "applesauce-core/helpers";
import { GroupPointer } from "applesauce-core/helpers/groups";
import { NostrEvent } from "nostr-tools";

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
