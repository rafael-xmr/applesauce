import { useMemo } from "react";
import { getParsedTextContent } from "applesauce-content/text";
import { EventTemplate, NostrEvent } from "nostr-tools";

import { useRenderNast } from "./use-render-nast.js";
import { ComponentMap } from "../helpers/nast.js";
import { buildLinkRenderer, LinkRenderer } from "../helpers/build-link-renderer.js";
import { truncateContent } from "applesauce-content/nast";

export { ComponentMap };

type Options = {
  /** Override transformers */
  transformers?: Parameters<typeof getParsedTextContent>[2];
  /** If set will use {@link buildLinkRenderer} to render links */
  linkRenderers?: LinkRenderer[];
  /** Override event content */
  content?: string;
  /** Maximum length */
  maxLength?: number;
};

/** Returns the parsed and render text content for an event */
export function useRenderedContent(
  event: NostrEvent | EventTemplate | string | undefined,
  components: ComponentMap,
  opts?: Options,
) {
  // if link renderers are set, override the link components
  const _components = useMemo(
    () => (opts?.linkRenderers ? { ...components, link: buildLinkRenderer(opts.linkRenderers) } : components),
    [opts?.linkRenderers, components],
  );

  // add additional transformers
  const nast = useMemo(
    () => (event ? getParsedTextContent(event, opts?.content, opts?.transformers) : undefined),
    [event, opts?.content, opts?.transformers],
  );

  let truncated = nast;
  if (opts?.maxLength && nast) truncated = truncateContent(nast, opts.maxLength);

  return useRenderNast(truncated, _components);
}
