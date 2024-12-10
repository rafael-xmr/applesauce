import { Expressions } from "applesauce-content/helpers";
import { EventFactoryOperation } from "../event-factory.js";

/** Adds "t" tags for every #hashtag in the content */
export function includeContentHashtags(): EventFactoryOperation {
  return (draft) => {
    const tags = Array.from(draft.tags);

    // create tags for all occurrences of #hashtag
    const matches = draft.content.matchAll(Expressions.hashtag);
    for (const [_, hashtag] of matches) {
      const lower = hashtag.toLocaleLowerCase();

      if (!tags.find((t) => t[0] === "t" && t[1] === lower)) {
        tags.push(["t", lower]);
      }
    }

    return { ...draft, tags };
  };
}
