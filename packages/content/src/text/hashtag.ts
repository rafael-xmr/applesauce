import { Transformer } from "unified";
import { getHashtagTag } from "applesauce-core/helpers/hashtag";

import { Hashtag, Root } from "../nast/types.js";
import Expressions from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

export function hashtags(): Transformer<Root> {
  return (tree) => {
    const event = tree.event;
    if (!event) return;

    findAndReplace(tree, [
      [
        Expressions.hashtag,
        (_: string, $1: string) => {
          try {
            const tag = getHashtagTag(event, $1);
            if (!tag) return false;

            return {
              type: "hashtag",
              tag,
              name: $1,
              hashtag: tag[1].toLowerCase(),
            } satisfies Hashtag;
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
