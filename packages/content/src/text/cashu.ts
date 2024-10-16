import { Transformer } from "unified";
import { getDecodedToken } from "@cashu/cashu-ts";

import { Root } from "../nast/types.js";
import Expressions from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

export function cashuTokens(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        Expressions.cashu,
        (_: string, $1: string) => {
          try {
            const token = getDecodedToken($1);

            return {
              type: "cashu",
              token,
              raw: $1,
            };
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
