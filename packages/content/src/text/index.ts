import { EventTemplate, NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "applesauce-core/helpers/cache";
import { unified, Transformer } from "unified";

import { parseTextContent } from "./parser.js";
import { nostrMentions } from "./mentions.js";
import { cashuTokens } from "./cashu.js";
import { Root } from "../nast/types.js";
import { emojis } from "./emoji.js";

export * from "./mentions.js";

export const ParsedTextContentSymbol = Symbol.for("parsed-text-content");

function process(event: NostrEvent | EventTemplate, content?: string) {
  return unified().use(nostrMentions).use(cashuTokens).use(emojis).runSync(parseTextContent(event, content));
}

export type ParseTextContentOptions = {
  transformers?: (() => Transformer<Root>)[];
  overrideContent?: string;
};

export function getParedTextContent(event: NostrEvent | EventTemplate, opts?: ParseTextContentOptions) {
  // override content
  let ats = opts?.overrideContent
    ? process(event, opts.overrideContent)
    : getOrComputeCachedValue(event, ParsedTextContentSymbol, () => process(event));

  if (opts?.transformers) {
    const process = unified();
    for (const transformer of opts.transformers) {
      process.use(transformer);
    }
    ats = process.runSync(ats) as Root;
  }

  return ats;
}
