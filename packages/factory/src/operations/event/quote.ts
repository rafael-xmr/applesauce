import { EventOperation } from "../../event-factory.js";
import { ensureQuoteEventPointerTag } from "../../helpers/quote.js";
import { getContentPointers } from "../../helpers/content.js";

/** Include "q" quote tags for any nostr event mentioned in the content */
export function includeQuoteTags(): EventOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);
    const mentions = getContentPointers(draft.content);

    for (const mention of mentions) {
      switch (mention.type) {
        case "note":
          tags = ensureQuoteEventPointerTag(tags, { id: mention.data });
          break;
        case "nevent":
          tags = ensureQuoteEventPointerTag(tags, mention.data);
          break;
      }
    }

    return { ...draft, tags };
  };
}
