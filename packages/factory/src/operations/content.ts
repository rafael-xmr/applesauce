import { Emoji } from "applesauce-core/helpers/emoji";
import { EventFactoryOperation } from "../event-factory.js";
import { includeQuoteTags } from "./quote.js";
import { includeContentHashtags } from "./hashtags.js";
import { includeEmojiTags } from "./emojis.js";

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

export type TextContentOptions = {
  emojis?: Emoji[];
};

/** Create a set of operations for common text content */
export function createTextContentOperations(content: string, options?: TextContentOptions): EventFactoryOperation[] {
  return [
    setContent(content),
    includeQuoteTags(),
    includeContentHashtags(),
    options?.emojis && includeEmojiTags(options.emojis),
  ].filter((o) => !!o);
}
