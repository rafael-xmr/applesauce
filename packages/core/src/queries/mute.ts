import { kinds } from "nostr-tools";
import { Query } from "../query-store/index.js";
import { getMutedHashtags, getMutedPubkeys, getMutedThreads, getMutedWords } from "../helpers/mute.js";

export function UserMuteQuery(
  pubkey: string,
): Query<{ words: Set<string>; pubkeys: Set<string>; threads: Set<string>; hashtags: Set<string> } | undefined> {
  return {
    key: pubkey,
    run: (store) =>
      store.replaceable(kinds.Mutelist, pubkey).map((event) => {
        if (!event) return;

        const pubkeys = getMutedPubkeys(event);
        const threads = getMutedThreads(event);
        const hashtags = getMutedHashtags(event);
        const words = getMutedWords(event);

        return { pubkeys, threads, hashtags, words };
      }),
  };
}
