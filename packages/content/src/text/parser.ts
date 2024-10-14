import { tokenize } from "linkifyjs";
import { Root } from "../nast/types.js";
import { EventTemplate, NostrEvent } from "nostr-tools";

export function parseTextContent(event: NostrEvent | EventTemplate): Root {
  const tokens = tokenize(event.content);

  return {
    type: "root",
    event,
    children: tokens.map((token) => {
      if (token.isLink) return { type: "link", href: token.toHref(), value: token.toString() };
      else return { type: "text", value: token.v };
    }),
  };
}
