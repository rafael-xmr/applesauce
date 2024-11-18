import { EventTemplate, NostrEvent } from "nostr-tools";
import { getTagValue } from "./event.js";

export function getEmojiTag(event: NostrEvent | EventTemplate, code: string) {
  code = code.replace(/^:|:$/g, "").toLocaleLowerCase();

  return event.tags.filter((t) => t[0] === "emoji" && t[1] && t[2]).find((t) => t[1].toLowerCase() === code) as [
    "emoji",
    string,
    string,
  ];
}

/** Returns the name of a NIP-30 emoji pack */
export function getPackName(pack: NostrEvent) {
  return getTagValue(pack, "title") || getTagValue(pack, "d");
}

/** Returns an array of emojis from a NIP-30 emoji pack */
export function getEmojis(pack: NostrEvent) {
  return pack.tags
    .filter((t) => t[0] === "emoji" && t[1] && t[2])
    .map((t) => ({ name: t[1] as string, url: t[2] as string }));
}
