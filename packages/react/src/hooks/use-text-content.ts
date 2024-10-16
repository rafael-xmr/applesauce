import { useMemo } from "react";
import { getParedTextContent, ParseTextContentOptions } from "applesauce-content/text";
import { EventTemplate, NostrEvent } from "nostr-tools";

import { useRenderNast } from "./use-render-nast.js";
import { ComponentMap } from "../helpers/nast.js";

export { ComponentMap };

/** Returns the parsed and render text content for an event */
export function useRenderedContent(
  event: NostrEvent | EventTemplate,
  components: ComponentMap,
  opts?: ParseTextContentOptions,
) {
  const nast = useMemo(() => getParedTextContent(event, opts), [event, opts?.overrideContent, opts?.transformers]);
  return useRenderNast(nast, components);
}
