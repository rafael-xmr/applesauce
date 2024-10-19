import { Transformer } from "unified";
import { getEmojiTag } from "applesauce-core/helpers";

import { Emoji, Root } from "../nast/types.js";
import Expressions from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

export function emojis(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        Expressions.emoji,
        (full: string, $1: string) => {
          try {
            const tag = getEmojiTag(tree.event, $1);

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
