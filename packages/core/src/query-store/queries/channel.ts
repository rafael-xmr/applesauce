import { Filter, kinds, NostrEvent } from "nostr-tools";

import { Query } from "../index.js";
import { ChannelMetadataContent, getChannelMetadataContent } from "../../helpers/channel.js";
import { safeParse } from "../../helpers/json.js";

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
      return events.stream(filters).map((event) => {
        try {
          if (event.pubkey === latest.pubkey && event.created_at > latest.created_at) {
            latest = event;
          }

          return getChannelMetadataContent(latest);
        } catch (error) {
          return undefined;
        }
      });
    },
  };
}

/** Creates a query that returns a map of hidden messages Map<id, reason> */
export function ChannelHiddenQuery(channel: NostrEvent, authors: string[] = []): Query<Map<string, string>> {
  return {
    key: channel.id,
    run: (events) => {
      const hidden = new Map<string, string>();

      return events
        .stream([{ kinds: [kinds.ChannelHideMessage], "#e": [channel.id], authors: [channel.pubkey, ...authors] }])
        .map((event) => {
          const reason = safeParse(event.content)?.reason;
          for (const tag of event.tags) {
            if (tag[0] === "e" && tag[1]) hidden.set(tag[1], reason ?? "");
          }

          return hidden;
        });
    },
  };
}

/** Creates a query that returns a map of muted users Map<pubkey, reason> */
export function ChannelMutedQuery(channel: NostrEvent, authors: string[] = []): Query<Map<string, string>> {
  return {
    key: channel.id + authors.join(","),
    run: (events) => {
      const muted = new Map<string, string>();

      return events
        .stream([{ kinds: [kinds.ChannelMuteUser], "#e": [channel.id], authors: [channel.pubkey, ...authors] }])
        .map((event) => {
          const reason = safeParse(event.content)?.reason;
          for (const tag of event.tags) {
            if (tag[0] === "p" && tag[1]) muted.set(tag[1], reason ?? "");
          }

          return muted;
        });
    },
  };
}

/** Creates a query that returns all messages in a channel */
export function ChannelMessagesQuery(channel: NostrEvent): Query<NostrEvent[]> {
  return {
    key: channel.id,
    run: (events) => events.timeline([{ kinds: [kinds.ChannelMessage], "#e": [channel.id] }]),
  };
}
