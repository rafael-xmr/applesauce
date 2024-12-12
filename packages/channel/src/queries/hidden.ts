import { Query } from "applesauce-core";
import { safeParse } from "applesauce-core/helpers/json";
import { kinds, NostrEvent } from "nostr-tools";
import { map } from "rxjs";

/** Creates a query that returns a map of hidden messages Map<id, reason> */
export function ChannelHiddenQuery(channel: NostrEvent, authors: string[] = []): Query<Map<string, string>> {
  return {
    key: channel.id,
    run: (events) => {
      const hidden = new Map<string, string>();

      return events
        .stream([{ kinds: [kinds.ChannelHideMessage], "#e": [channel.id], authors: [channel.pubkey, ...authors] }])
        .pipe(
          map((event) => {
            const reason = safeParse(event.content)?.reason;
            for (const tag of event.tags) {
              if (tag[0] === "e" && tag[1]) hidden.set(tag[1], reason ?? "");
            }

            return hidden;
          }),
        );
    },
  };
}
