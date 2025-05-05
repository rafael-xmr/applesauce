import { Transformer } from "unified";

import { Link, Root } from "../nast/types.js";
import { Tokens } from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

export function links(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        Tokens.link,
        (_: string) => {
          try {
            return {
              type: "link",
              href: new URL(_).toString(),
              value: _,
            } satisfies Link;
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
