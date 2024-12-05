import { type Transformer } from "unified";
import { getEmojiTag } from "applesauce-core/helpers/emoji";

import { Emoji, Root } from "../nast/types.js";
import Expressions from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

/** Adds emoji tags to text ATS */
export function emojis(): Transformer<Root> {
  return (tree) => {
    const event = tree.event;
    if (!event) return;

    findAndReplace(tree, [
      [
        Expressions.emoji,
        (full: string, $1: string) => {
          try {
            const tag = getEmojiTag(event, $1);
            if (!tag) return false;

            return {
              type: "emoji",
              tag,
              raw: full,
              code: tag[1].toLowerCase(),
              url: tag[2],
            } satisfies Emoji;
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
