import { EventFactoryOperation } from "../event-factory.js";

export function includeSingletonTag(tag: [string, ...string[]], replace = true): EventFactoryOperation {
  return (draft) => {
    const current = draft.tags.find((t) => t[0] === tag[0]);

    if (current) {
      if (replace) return { ...draft, tags: draft.tags.map((t) => (t[0] === tag[0] ? tag : t)) };
      else return draft;
    } else {
      return { ...draft, tags: [...draft.tags, tag] };
    }
  };
}
