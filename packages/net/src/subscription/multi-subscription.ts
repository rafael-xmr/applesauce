import { nanoid } from "nanoid";
import { Subject } from "rxjs";
import { Filter, NostrEvent } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { addSeenRelay, isFilterEqual } from "applesauce-core/helpers";

import { IConnectionPool } from "../connection/index.js";
import { PersistentSubscription } from "./persistent-subscription.js";

export class MultiSubscription {
  static OPEN = "open";
  static CLOSED = "closed";

  id: string;
  pool: IConnectionPool;
  filters: Filter[] = [];

  relays = new Set<AbstractRelay>();
  subscriptions = new Map<AbstractRelay, PersistentSubscription>();

  state = MultiSubscription.CLOSED;

  onEvent = new Subject<NostrEvent>();

  constructor(pool: IConnectionPool) {
    this.id = nanoid(8);
    this.pool = pool;
  }

  /** Update the filters for this subscription */
  setFilters(filters: Filter[]) {
    if (isFilterEqual(this.filters, filters)) return;
    this.filters = filters;
    this.updateSubscriptions();
  }

  /** Update the relays for this subscription */
  setRelays(relays: Iterable<string | URL | AbstractRelay>) {
    const newRelays = Array.from(relays).map((relay) => {
      if (typeof relay === "string" || relay instanceof URL) return this.pool.getConnection(relay);
      return relay;
    });

    // remove relays
    for (const relay of this.relays) {
      if (!newRelays.includes(relay)) {
        this.relays.delete(relay);
        const sub = this.subscriptions.get(relay);
        if (sub) {
          sub.close();
          this.subscriptions.delete(relay);
        }
      }
    }

    // add relays
    for (const relay of newRelays) {
      this.relays.add(relay);
    }

    this.updateSubscriptions();
  }

  protected handleEvent(event: NostrEvent, relay: AbstractRelay) {
    addSeenRelay(event, relay.url);
    this.onEvent.next(event);
  }

  protected updateSubscriptions() {
    // close all subscriptions if not open
    if (this.state !== MultiSubscription.OPEN) {
      for (const [_relay, subscription] of this.subscriptions) subscription.close();
      return;
    }

    // else open and update subscriptions
    for (const relay of this.relays) {
      let subscription = this.subscriptions.get(relay);
      if (!subscription || !isFilterEqual(subscription.filters, this.filters) || subscription.closed) {
        if (!subscription) {
          subscription = new PersistentSubscription(relay, this.filters, {
            onevent: (event) => this.handleEvent(event, relay),
          });

          this.subscriptions.set(relay, subscription);
        }

        if (subscription) {
          subscription.filters = this.filters;
          subscription.update().catch((_err) => {
            // Eat error
          });
        }
      }
    }
  }

  publish(event: NostrEvent) {
    return Promise.allSettled(
      Array.from(this.relays).map(async (relay) => {
        if (!relay.connected) await relay.connect();
        return await relay.publish(event);
      }),
    );
  }

  open() {
    if (this.state === MultiSubscription.OPEN) return this;

    this.state = MultiSubscription.OPEN;
    this.updateSubscriptions();

    return this;
  }

  /** Wait for all relays to be connected */
  waitForAllConnection(): Promise<void> {
    return Promise.allSettled(
      Array.from(this.relays)
        .filter((r) => !r.connected)
        .map((r) => r.connect()),
    ).then((_v) => void 0);
  }

  close() {
    if (this.state !== MultiSubscription.OPEN) return;

    // unsubscribe from relay messages
    this.state = MultiSubscription.CLOSED;

    // close all
    this.updateSubscriptions();
  }
}
