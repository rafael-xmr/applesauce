import { EventTemplate, NostrEvent } from "nostr-tools";
import { tokenize } from "linkifyjs";

import { Root } from "../nast/types.js";

/** Creates a {@link Root} ATS node for a text note */
export function createTextNoteATS(event: NostrEvent | EventTemplate | string, content?: string): Root {
  const tokens = tokenize(content || (typeof event === "string" ? event : event.content));

  return {
    type: "root",
    event: typeof event !== "string" ? event : undefined,
    children: tokens.map((token) => {
      if (token.isLink) return { type: "link", href: token.toHref(), value: token.toString() };
      else return { type: "text", value: token.v };
    }),
  };
}
