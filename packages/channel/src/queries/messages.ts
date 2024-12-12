import { Query } from "applesauce-core";
import { kinds, NostrEvent } from "nostr-tools";

/** Creates a query that returns all messages in a channel */
export function ChannelMessagesQuery(channel: NostrEvent): Query<NostrEvent[]> {
  return {
    key: channel.id,
    run: (events) => events.timeline([{ kinds: [kinds.ChannelMessage], "#e": [channel.id] }]),
  };
}
