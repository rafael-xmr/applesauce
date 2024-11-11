import { Transformer } from "unified";

import { Root } from "../nast/types.js";

export function eolMetadata(): Transformer<Root> {
  return (tree) => {
    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i];
      const next = tree.children[i + 1];

      if (!next || (next.type === "text" && next.value.startsWith("\n"))) {
        node.data = node.data || {};
        node.data.eol = true;
      }
    }
  };
}
