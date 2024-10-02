import { unixNow } from "applesauce-core/helpers";
import { EventTemplate, NostrEvent } from "nostr-tools";

export type TagOperation = (tags: string[][]) => string[][];
export function modifyListTags(list: NostrEvent | EventTemplate, operation: TagOperation): EventTemplate {
  return {
    created_at: unixNow(),
    kind: list.kind,
    content: list.content,
    tags: operation(list.tags),
  };
}

// function listHasTag(list: NostrEvent | EventTemplate, tag: string[]) {
//   return list.tags.some((t) => {
//     if (t.length < tag.length) return false;
//     for (let i = 0; i < t.length; i++) {
//       if (t[i] !== tag[i]) return false;
//     }
//     return true;
//   });
// }
