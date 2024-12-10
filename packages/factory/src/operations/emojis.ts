import { Emoji } from "applesauce-core/helpers/emoji";
import { Expressions } from "applesauce-content/helpers";

import { EventFactoryOperation } from "../event-factory.js";

/** Adds "emoji" tags for NIP-30 emojis */
export function includeEmojiTags(emojis: Emoji[]): EventFactoryOperation {
  return (draft) => {
    const tags = Array.from(draft.tags);

    // create tags for all occurrences of #hashtag
    const matches = draft.content.matchAll(Expressions.emoji);
    for (const [_, name] of matches) {
      const emoji = emojis.find((e) => e.name === name);

      if (emoji?.url) {
        tags.push(["emoji", emoji.name, emoji.url]);
      }
    }

    return { ...draft, tags };
  };
}
