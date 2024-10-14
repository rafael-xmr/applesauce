import { useMemo } from "react";
import { Root } from "applesauce-content/nast";
import { ComponentMap, renderNast } from "../helpers/nast.js";

export { ComponentMap };

export function useRenderNast(root: Root, components: ComponentMap) {
  return useMemo(() => renderNast(root, components), [root]);
}
