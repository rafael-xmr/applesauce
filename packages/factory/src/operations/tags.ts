import { EventFactoryOperation } from "../event-factory.js";

/** Includes only a single instance of tag */
export function includeSingletonTag(tag: [string, ...string[]], replace = true): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);
    const existing = tags.find((t) => t[0] === tag[0]);

    if (existing) {
      if (replace) tags = draft.tags.map((t) => (t[0] === tag[0] ? tag : t));
    } else {
      tags = [...tags, tag];
    }

    return { ...draft, tags };
  };
}
