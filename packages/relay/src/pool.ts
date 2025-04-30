import { NostrEvent, type Filter } from "nostr-tools";
import { Observable } from "rxjs";

import { RelayGroup } from "./group.js";
import { Relay, RelayOptions } from "./relay.js";
import {
  IPool,
  PublishResponse,
  PublishOptions,
  RequestOptions,
  SubscriptionOptions,
  SubscriptionResponse,
} from "./types.js";

export class RelayPool implements IPool {
  relays = new Map<string, Relay>();
  groups = new Map<string, RelayGroup>();

  constructor(public options?: RelayOptions) {}

  /** Get or create a new relay connection */
  relay(url: string): Relay {
    let relay = this.relays.get(url);
    if (relay) return relay;
    else {
      relay = new Relay(url, this.options);
      this.relays.set(url, relay);
      return relay;
    }
  }

  /** Create a group of relays */
  group(relays: string[]): RelayGroup {
    const key = relays.sort().join(",");
    let group = this.groups.get(key);
    if (group) return group;

    group = new RelayGroup(relays.map((url) => this.relay(url)));
    this.groups.set(key, group);
    return group;
  }

  /** Make a REQ to multiple relays that does not deduplicate events */
  req(relays: string[], filters: Filter | Filter[], id?: string): Observable<SubscriptionResponse> {
    return this.group(relays).req(filters, id);
  }

  /** Send an EVENT message to multiple relays */
  event(relays: string[], event: NostrEvent): Observable<PublishResponse> {
    return this.group(relays).event(event);
  }

  /** Publish an event to multiple relays */
  publish(relays: string[], event: NostrEvent, opts?: PublishOptions): Observable<PublishResponse> {
    return this.group(relays).publish(event, opts);
  }

  /** Request events from multiple relays */
  request(relays: string[], filters: Filter | Filter[], opts?: RequestOptions): Observable<NostrEvent> {
    return this.group(relays).request(filters, opts);
  }

  /** Open a subscription to multiple relays */
  subscription(
    relays: string[],
    filters: Filter | Filter[],
    opts?: SubscriptionOptions,
  ): Observable<SubscriptionResponse> {
    return this.group(relays).subscription(filters, opts);
  }
}
