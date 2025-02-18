import { EventTemplate, NostrEvent } from "nostr-tools";
import { getTagValue } from "./event.js";

/** Gets an "emoji" tag that matches an emoji code */
export function getEmojiTag(event: NostrEvent | EventTemplate, code: string): ["emoji", string, string] | undefined {
  code = code.replace(/^:|:$/g, "").toLocaleLowerCase();

  return event.tags.find((t) => t[0] === "emoji" && t.length >= 3 && t[1].toLowerCase() === code) as
    | ["emoji", string, string]
    | undefined;
}

/** Returns the name of a NIP-30 emoji pack */
export function getPackName(pack: NostrEvent): string | undefined {
  return getTagValue(pack, "title") || getTagValue(pack, "d");
}

export type Emoji = {
  /** The emoji shortcode (without the ::) */
  shortcode: string;
  /** The URL to the emoji image */
  url: string;
};

/** Returns an array of emojis from a NIP-30 emoji pack */
export function getEmojis(pack: NostrEvent): Emoji[] {
  return pack.tags
    .filter((t) => t[0] === "emoji" && t[1] && t[2])
    .map((t) => ({ shortcode: t[1] as string, url: t[2] as string }));
}
