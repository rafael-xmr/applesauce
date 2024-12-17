import { Emoji } from "applesauce-core/helpers/emoji";
import { getPubkeyFromDecodeResult } from "applesauce-core/helpers";

import { EventFactoryOperation } from "../event-factory.js";
import { includeQuoteTags } from "./quote.js";
import { includeContentHashtags } from "./hashtags.js";
import { includeContentEmojiTags } from "./emojis.js";
import { getContentPointers } from "../helpers/content.js";
import { ensureProfilePointerTag } from "../helpers/common-tags.js";

/** Override the event content */
export function setContent(content: string): EventFactoryOperation {
  return async (draft) => {
    return { ...draft, content };
  };
}

/** Encrypts the content to a pubkey */
export function setEncryptedContent(pubkey: string, content: string, method: "nip04" | "nip44"): EventFactoryOperation {
  return async (draft, { signer }) => {
    if (!signer) throw new Error("Signer required for encrypted content");
    if (!signer[method]) throw new Error(`Signer does not support ${method} encryption`);

    return { ...draft, content: await signer[method].encrypt(pubkey, content) };
  };
}

/** Replaces any `@npub` or bare npub mentions with nostr: prefix */
export function repairContentNostrLinks(): EventFactoryOperation {
  return (draft) => ({
    ...draft,
    content: draft.content.replaceAll(
      /(?<=^|\s)(?:@)?((?:npub|note|nprofile|nevent|naddr)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58})/gi,
      "nostr:$1",
    ),
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

/** Sets the NIP-36 content-warning tag */
export function setContentWarning(warning: boolean | string): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);

    // remove existing content warning
    tags = tags.filter((t) => t[0] !== "content-warning");

    if (typeof warning === "string") tags.push(["content-warning", warning]);
    else if (warning === true) tags.push(["content-warning"]);

    return { ...draft, tags };
  };
}

export type TextContentOptions = {
  emojis?: Emoji[];
  contentWarning?: boolean | string;
};

/** Create a set of operations for common text content */
export function createTextContentOperations(content: string, options?: TextContentOptions): EventFactoryOperation[] {
  return [
    setContent(content),
    repairContentNostrLinks(),
    tagPubkeyMentionedInContent(),
    includeQuoteTags(),
    includeContentHashtags(),
    options?.emojis && includeContentEmojiTags(options.emojis),
    options?.contentWarning !== undefined ? setContentWarning(options.contentWarning) : undefined,
  ].filter((o) => !!o);
}
