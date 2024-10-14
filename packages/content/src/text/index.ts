import { EventTemplate, NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";
import { unified } from "unified";

import { parseTextContent } from "./parser.js";
import { nostrMentions } from "./mentions.js";

export * from "./mentions.js";

export const ParsedTextContentSymbol = Symbol.for("parsed-text-content");

export function getParedTextContent(event: NostrEvent | EventTemplate) {
  return getOrComputeCachedValue(event, ParsedTextContentSymbol, () => {
    return unified().use(nostrMentions).runSync(parseTextContent(event));
  });
}
