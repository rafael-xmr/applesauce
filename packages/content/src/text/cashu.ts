import { Transformer } from "unified";

import { Root } from "../nast/types.js";
import Expressions from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

export function cashuToken(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        Expressions.cashu,
        (_: string, $1: string) => {
          try {
            return {
              type: "cashu",
              token: $1,
            };
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}
