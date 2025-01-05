import { EventFactoryOperation } from "../event-factory.js";
import { ensureSingletonTag } from "../helpers/tag.js";

/** Includes only a single instance of tag */
export function includeSingletonTag(tag: string[], replace = true): EventFactoryOperation {
  return (draft) => {
    return { ...draft, tags: ensureSingletonTag(draft.tags, tag, replace) };
  };
}

/** Includes a NIP-31 alt tag */
export function includeAltTag(description: string): EventFactoryOperation {
  return includeSingletonTag(["alt", description]);
}
