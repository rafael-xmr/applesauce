import { EventTemplate, NostrEvent } from "nostr-tools";

export function getEmojiTag(event: NostrEvent | EventTemplate, code: string) {
  code = code.replace(/^:|:$/g, "").toLocaleLowerCase();

  return event.tags.filter((t) => t[0] === "emoji" && t[1] && t[2]).find((t) => t[1].toLowerCase() === code) as [
    "emoji",
    string,
    string,
  ];
}
