import { canHaveHiddenTags, getHiddenTags, getListEncryptionMethods, hasHiddenTags } from "applesauce-core/helpers";
import { EventFactoryOperation } from "../../event-factory.js";
import { includeSingletonTag } from "../tags.js";

export type TagOperation = (tags: string[][]) => string[][];

/** Creates an operation that modifies the existing array of tags on an event */
export function modifyPublicTags(...operations: TagOperation[]): EventFactoryOperation {
  return async (draft) => {
    let tags = Array.from(draft.tags);

    // modify the pubic tags
    if (Array.isArray(operations)) {
      for (const operation of operations) tags = operation(tags);
    }

    return { ...draft, tags };
  };
}

/** Creates an operation that modifies the existing array of tags on an event */
export function modifyHiddenTags(...operations: TagOperation[]): EventFactoryOperation {
  return async (draft, ctx) => {
    let tags = Array.from(draft.tags);

    if (!ctx.signer) throw new Error("Missing signer for hidden tags");
    if (!canHaveHiddenTags(draft.kind)) throw new Error("Event kind does not support hidden tags");

    const hidden = hasHiddenTags(draft) ? getHiddenTags(draft) : [];
    if (hidden === undefined) throw new Error("Hidden tags are locked");

    let newHidden = Array.from(hidden);
    for (const operation of operations) newHidden = operation(newHidden);

    const encryption = getListEncryptionMethods(draft.kind, ctx.signer);

    const pubkey = await ctx.signer.getPublicKey();
    const content = await encryption.encrypt(pubkey, JSON.stringify(newHidden));

    return { ...draft, content, tags };
  };
}

/** Sets the "title" tag on a NIP-51 list */
export function setListTitle(title: string): EventFactoryOperation {
  return includeSingletonTag(["title", title], true);
}

/** Sets the "image" tag on a NIP-51 list */
export function setListImage(image: string): EventFactoryOperation {
  return includeSingletonTag(["image", image], true);
}

/** Sets the "description" tag on a NIP-51 list */
export function setListDescription(description: string): EventFactoryOperation {
  return includeSingletonTag(["description", description], true);
}
