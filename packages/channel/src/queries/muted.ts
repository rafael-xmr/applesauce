import { Query } from "applesauce-core";
import { safeParse } from "applesauce-core/helpers/json";
import { kinds, NostrEvent } from "nostr-tools";
import { map } from "rxjs";

/** Creates a query that returns a map of muted users Map<pubkey, reason> */
export function ChannelMutedQuery(channel: NostrEvent, authors: string[] = []): Query<Map<string, string>> {
  return {
    key: channel.id + authors.join(","),
    run: (events) => {
      const muted = new Map<string, string>();

      return events
        .stream([{ kinds: [kinds.ChannelMuteUser], "#e": [channel.id], authors: [channel.pubkey, ...authors] }])
        .pipe(
          map((event) => {
            const reason = safeParse(event.content)?.reason;
            for (const tag of event.tags) {
              if (tag[0] === "p" && tag[1]) muted.set(tag[1], reason ?? "");
            }

            return muted;
          }),
        );
    },
  };
}
