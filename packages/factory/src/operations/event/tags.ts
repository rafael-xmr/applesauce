import {
  canHaveHiddenTags,
  getHiddenTags,
  getListEncryptionMethods,
  hasHiddenTags,
  unlockHiddenTags,
} from "applesauce-core/helpers";
import { EventOperation, TagOperation } from "../../event-factory.js";
import { ensureNamedValueTag, ensureSingletonTag } from "../../helpers/tag.js";

/** Includes only a single instance of tag */
export function includeSingletonTag(tag: [string, ...string[]], replace = true): EventOperation {
  return (draft) => {
    return { ...draft, tags: ensureSingletonTag(draft.tags, tag, replace) };
  };
}

/** Includes only a single name / value tag */
export function includeNameValueTag(tag: [string, string, ...string[]], replace = true): EventOperation {
  return (draft) => {
    return { ...draft, tags: ensureNamedValueTag(draft.tags, tag, replace) };
  };
}

/** Includes a NIP-31 alt tag */
export function includeAltTag(description: string): EventOperation {
  return includeSingletonTag(["alt", description]);
}

/** Creates an operation that modifies the existing array of tags on an event */
export function modifyPublicTags(...operations: TagOperation[]): EventOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    // modify the pubic tags
    if (Array.isArray(operations)) {
      for (const operation of operations) tags = await operation(tags, ctx);
    }

    return { ...draft, tags };
  };
}

/** Creates an operation that modifies the existing array of tags on an event */
export function modifyHiddenTags(...operations: TagOperation[]): EventOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    if (!ctx.signer) throw new Error("Missing signer for hidden tags");
    if (!canHaveHiddenTags(draft.kind)) throw new Error("Event kind does not support hidden tags");

    let hidden: string[][] | undefined = undefined;

    if (hasHiddenTags(draft)) {
      hidden = getHiddenTags(draft);

      if (hidden === undefined) {
        if (hasHiddenTags(draft)) {
          // draft is an existing event, attempt to unlock tags
          const pubkey = await ctx.signer.getPublicKey();
          const unlocked = await unlockHiddenTags({ ...draft, pubkey }, ctx.signer);
          // try again
          hidden = getHiddenTags(unlocked);
        } else {
          // create a new array of hidden tags
          hidden = [];
        }
      }
    } else {
      // this is a fresh draft, create a new hidden tags
      hidden = [];
    }

    if (hidden === undefined) throw new Error("Failed to find hidden tags");

    let newHidden = Array.from(hidden);
    for (const operation of operations) newHidden = await operation(newHidden, ctx);

    const encryption = getListEncryptionMethods(draft.kind, ctx.signer);

    const pubkey = await ctx.signer.getPublicKey();
    const content = await encryption.encrypt(pubkey, JSON.stringify(newHidden));

    return { ...draft, content, tags };
  };
}
