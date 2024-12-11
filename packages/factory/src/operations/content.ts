import { Emoji } from "applesauce-core/helpers/emoji";
import { getPubkeyFromDecodeResult } from "applesauce-core/helpers";

import { EventFactoryOperation } from "../event-factory.js";
import { includeQuoteTags } from "./quote.js";
import { includeContentHashtags } from "./hashtags.js";
import { includeEmojiTags } from "./emojis.js";
import { getContentPointers } from "../helpers/content.js";
import { ensureProfilePointerTag } from "../helpers/common-tags.js";

export function setContent(content: string): EventFactoryOperation {
  return async (draft) => {
    return { ...draft, content };
  };
}

export function setEncryptedContent(pubkey: string, content: string, method: "nip04" | "nip44"): EventFactoryOperation {
  return async (draft, { signer }) => {
    if (!signer) throw new Error("Signer required for encrypted content");
    if (!signer[method]) throw new Error(`Signer does not support ${method} encryption`);

    return { ...draft, content: await signer[method].encrypt(pubkey, content) };
  };
}

/** Replaces any @npub or npub mentions with nostr: prefix */
export function repairContentNostrLinks(): EventFactoryOperation {
  return (draft) => ({
    ...draft,
    content: draft.content.replaceAll(/(?<=^|\s)(?:@)?(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi, "nostr:$1"),
  });
}

/** "p" tag any pubkey mentioned in the content using nostr: links */
export function tagPubkeyMentionedInContent(): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);
    const mentions = getContentPointers(draft.content);

    for (const mention of mentions) {
      const pubkey = getPubkeyFromDecodeResult(mention);
      if (pubkey) tags = ensureProfilePointerTag(tags, mention.type === "nprofile" ? mention.data : { pubkey });
    }

    return { ...draft, tags };
  };
}

export type TextContentOptions = {
  emojis?: Emoji[];
};

/** Create a set of operations for common text content */
export function createTextContentOperations(content: string, options?: TextContentOptions): EventFactoryOperation[] {
  return [
    setContent(content),
    repairContentNostrLinks(),
    tagPubkeyMentionedInContent(),
    includeQuoteTags(),
    includeContentHashtags(),
    options?.emojis && includeEmojiTags(options.emojis),
  ].filter((o) => !!o);
}
