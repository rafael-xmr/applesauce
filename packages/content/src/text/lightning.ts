import { type Transformer } from "unified";
import { parseBolt11 } from "applesauce-core/helpers/bolt11";

import { LightningInvoice, Root } from "../nast/types.js";
import Expressions from "../helpers/regexp.js";
import { findAndReplace } from "../nast/find-and-replace.js";

export function lightningInvoices(): Transformer<Root> {
  return (tree) => {
    findAndReplace(tree, [
      [
        Expressions.lightning,
        (_: string, $1: string) => {
          try {
            const invoice = $1;
            const parsed = parseBolt11(invoice);

            return {
              type: "lightning",
              invoice,
              parsed,
            } satisfies LightningInvoice;
          } catch (error) {}

          return false;
        },
      ],
    ]);
  };
}