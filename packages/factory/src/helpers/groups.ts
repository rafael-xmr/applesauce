import { GroupPointer } from "applesauce-core/helpers/groups";
import { fillAndTrimTag } from "./tag.js";

/** Creates a "group" tag from a {@link GroupPointer} */
export function createGroupTagFromGroupPointer(group: GroupPointer) {
  return fillAndTrimTag(["group", group.id, group.relay, group.name], 3);
}
