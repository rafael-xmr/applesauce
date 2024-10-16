import { useMemo } from "react";
import { Root } from "applesauce-content/nast";
import { ComponentMap, renderNast } from "../helpers/nast.js";

export { ComponentMap };

/** A hook to get the rendered output of a nostr syntax tree */
export function useRenderNast(root: Root, components: ComponentMap) {
  return useMemo(() => renderNast(root, components), [root, Object.keys(components).join("|")]);
}
