import { isParameterizedReplaceableKind } from "nostr-tools/kinds";
import { nanoid } from "nanoid";

import { EventOperation } from "../../event-factory.js";
import { ensureSingletonTag } from "../../helpers/tag.js";

/** Ensures parameterized replaceable kinds have "d" tags */
export function includeReplaceableIdentifier(identifier: string | (() => string) = nanoid): EventOperation {
  return (draft) => {
    if (!isParameterizedReplaceableKind(draft.kind)) return draft;

    if (!draft.tags.some((t) => t[0] === "d" && t[1])) {
      let tags = Array.from(draft.tags);
      const id = typeof identifier === "string" ? identifier : identifier();

      tags = ensureSingletonTag(tags, ["d", id], true);
      return { ...draft, tags };
    }

    return draft;
  };
}
