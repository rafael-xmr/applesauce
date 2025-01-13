import { Expressions } from "applesauce-content/helpers";
import { EventFactoryOperation } from "../event-factory.js";
import { ensureNamedValueTag } from "../helpers/tag.js";

/** Adds "t" tags for every #hashtag in the content */
export function includeContentHashtags(): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);

    // create tags for all occurrences of #hashtag
    const matches = draft.content.matchAll(Expressions.hashtag);
    for (const [_, hashtag] of matches) {
      const lower = hashtag.toLocaleLowerCase();
      tags = ensureNamedValueTag(tags, ["t", lower]);
    }

    return { ...draft, tags };
  };
}

/** Adds "t" tags for an array of hashtags */
export function includeHashtags(hashtags: string[]): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);

    for (const hashtag of hashtags) {
      const lower = hashtag.toLocaleLowerCase();
      tags = ensureNamedValueTag(tags, ["t", lower]);
    }

    return { ...draft, tags };
  };
}
