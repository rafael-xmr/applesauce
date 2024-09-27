import { NostrEvent } from "nostr-tools";

export const MutePubkeysSymbol = Symbol.for("mute-pubkeys");
export const MuteThreadsSymbol = Symbol.for("mute-threads");
export const MuteHashtagsSymbol = Symbol.for("mute-hashtags");
export const MuteWordsSymbol = Symbol.for("mute-words");

declare module "nostr-tools" {
  export interface Event {
    [MutePubkeysSymbol]?: Set<string>;
    [MuteThreadsSymbol]?: Set<string>;
    [MuteHashtagsSymbol]?: Set<string>;
    [MuteWordsSymbol]?: Set<string>;
  }
}

/** Returns a set of muted pubkeys */
export function getMutedPubkeys(mute: NostrEvent) {
  let pubkeys = mute[MutePubkeysSymbol];

  if (!pubkeys) {
    pubkeys = mute[MutePubkeysSymbol] = new Set();

    for (const tag of mute.tags) {
      if (tag[0] === "p" && tag[1]) pubkeys.add(tag[1]);
    }
  }

  return pubkeys;
}

/** Returns a set of muted threads */
export function getMutedThreads(mute: NostrEvent) {
  let threads = mute[MuteThreadsSymbol];

  if (!threads) {
    threads = mute[MuteThreadsSymbol] = new Set();

    for (const tag of mute.tags) {
      if (tag[0] === "e" && tag[1]) threads.add(tag[1]);
    }
  }

  return threads;
}

/** Returns a set of muted words ( lowercase ) */
export function getMutedWords(mute: NostrEvent) {
  let words = mute[MuteWordsSymbol];

  if (!words) {
    words = mute[MuteWordsSymbol] = new Set();

    for (const tag of mute.tags) {
      if (tag[0] === "word" && tag[1]) words.add(tag[1].toLocaleLowerCase());
    }
  }

  return words;
}

/** Returns a set of muted hashtags ( lowercase ) */
export function getMutedHashtags(mute: NostrEvent) {
  let hashtags = mute[MuteHashtagsSymbol];

  if (!hashtags) {
    hashtags = mute[MuteHashtagsSymbol] = new Set();

    for (const tag of mute.tags) {
      if (tag[0] === "t" && tag[1]) hashtags.add(tag[1].toLocaleLowerCase());
    }
  }

  return hashtags;
}
