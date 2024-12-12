import { Filter, kinds, NostrEvent } from "nostr-tools";
import { ChannelMetadataContent, getChannelMetadataContent } from "../helpers/channel.js";
import { Query } from "applesauce-core";
import { map } from "rxjs/operators";

/** Creates a query that returns the latest parsed metadata */
export function ChannelMetadataQuery(channel: NostrEvent): Query<ChannelMetadataContent | undefined> {
  return {
    key: channel.id,
    run: (events) => {
      const filters: Filter[] = [
        { ids: [channel.id] },
        { kinds: [kinds.ChannelMetadata], "#e": [channel.id], authors: [channel.pubkey] },
      ];

      let latest = channel;
      return events.stream(filters).pipe(
        map((event) => {
          try {
            if (event.pubkey === latest.pubkey && event.created_at > latest.created_at) {
              latest = event;
            }

            return getChannelMetadataContent(latest);
          } catch (error) {
            return undefined;
          }
        }),
      );
    },
  };
}
