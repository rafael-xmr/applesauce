import { EventTemplate, NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";
import { unified } from "unified";

import { parseTextContent } from "./parser.js";
import { nostrMentions } from "./mentions.js";
import { cashuTokens } from "./cashu.js";

export * from "./mentions.js";

export const ParsedTextContentSymbol = Symbol.for("parsed-text-content");

function process(event: NostrEvent | EventTemplate, content?: string) {
  return unified().use(nostrMentions).use(cashuTokens).runSync(parseTextContent(event, content));
}

export function getParedTextContent(event: NostrEvent | EventTemplate, content?: string) {
  // override content
  if (content) return process(event, content);

  return getOrComputeCachedValue(event, ParsedTextContentSymbol, () => {
    return process(event, content);
  });
}
