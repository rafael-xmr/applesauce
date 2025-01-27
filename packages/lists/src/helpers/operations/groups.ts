import { GroupPointer } from "applesauce-core/helpers/groups";
import { createGroupTagFromGroupPointer } from "applesauce-factory/helpers";
import { TagOperation } from "applesauce-factory/operations";

/** Adds a "group" tag to a list */
export function addGroupTag(group: GroupPointer): TagOperation {
  return (tags) => {
    const existing = tags.find((t) => t[0] === "group" && t[1] === group.id && t[2] === group.relay);

    if (existing) return tags.map((tag) => (tag === existing ? createGroupTagFromGroupPointer(group) : tag));
    else return [...tags, createGroupTagFromGroupPointer(group)];
  };
}

/** Removes a "group" tag from a list */
export function removeGroupTag(group: GroupPointer): TagOperation {
  return (tags) => tags.filter((tag) => tag[0] === "group" && tag[1] === group.id && tag[2] === group.relay);
}
