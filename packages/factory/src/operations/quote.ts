import { Expressions } from "applesauce-content/helpers";
import { nip19 } from "nostr-tools";

import { EventFactoryOperation } from "../event-factory.js";
import { createQuoteTagFromEventPointer } from "../helpers/quote.js";

/** Include "q" quote tags for any nostr event mentioned in the content */
export function includeQuoteTags(): EventFactoryOperation {
  return (draft) => {
    const tags = Array.from(draft.tags);
    const mentions = draft.content.matchAll(Expressions.nostrLink);

    for (const [_, $1] of mentions) {
      try {
        const decode = nip19.decode($1);
        switch (decode.type) {
          case "note":
            tags.push(["q", decode.data]);
            break;
          case "nevent":
            tags.push(createQuoteTagFromEventPointer(decode.data));
            break;
        }
      } catch (error) {}
    }

    return { ...draft, tags };
  };
}
