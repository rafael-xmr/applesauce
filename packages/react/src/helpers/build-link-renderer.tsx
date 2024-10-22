import { memo, useMemo } from "react";
import { ComponentMap } from "./nast.js";
import { Link } from "applesauce-content/nast";

export type LinkRenderer = (url: URL, node: Link) => JSX.Element | false | null;

export function buildLinkRenderer(handlers: LinkRenderer[]) {
  const LinkRenderer: ComponentMap["link"] = ({ node }) => {
    const content = useMemo(() => {
      try {
        const url = new URL(node.href);
        for (const handler of handlers) {
          try {
            const content = handler(url, node);
            if (content) return content;
          } catch (e) {}
        }
      } catch (error) {}
      return null;
    }, [node.href, node.value]);

    return content || <>{node.value}</>;
  };

  return memo(LinkRenderer);
}
