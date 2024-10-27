import { nanoid } from "nanoid";
import { Filter } from "nostr-tools";
import { AbstractRelay, Subscription, SubscriptionParams } from "nostr-tools/abstract-relay";
import { isFilterEqual } from "applesauce-core/helpers";

/** A subscription that tries to reconnect */
export class PersistentSubscription {
  id: string;
  relay: AbstractRelay;
  filters: Filter[];
  connecting = false;
  params: Partial<SubscriptionParams>;

  subscription: Subscription | null = null;
  get eosed() {
    return !!this.subscription?.eosed;
  }
  get closed() {
    return !this.subscription || this.subscription.closed;
  }

  constructor(relay: AbstractRelay, filters: Filter[], params: Partial<SubscriptionParams>) {
    this.id = nanoid(8);
    this.relay = relay;
    this.filters = filters;
    this.params = {
      //@ts-expect-error
      id: this.id,
      ...params,
    };
  }

  /** attempts to update the subscription */
  async update() {
    if (!this.filters || this.filters.length === 0) throw new Error("Missing filters");
    if (this.connecting) return;

    // Ensure relay is connected
    if (!this.relay.connected) {
      this.connecting = true;
      try {
        await this.relay.connect();
      } catch (error) {
        this.connecting = false;
        throw new Error("Failed to connect to relay");
      }
      this.connecting = false;
    }

    // recreate the subscription if its closed since nostr-tools cant reopen a sub
    if (!this.subscription || this.subscription.closed) {
      this.subscription = this.relay.subscribe(this.filters, {
        ...this.params,
        oneose: () => {
          this.params.oneose?.();
        },
        onclose: (reason) => {
          if (!this.closed) this.update();
          this.params.onclose?.(reason);
        },
      });
    } else if (isFilterEqual(this.subscription.filters, this.filters) === false) {
      this.subscription.filters = this.filters;
      // NOTE: reset the eosed flag since nostr-tools dose not
      this.subscription.eosed = false;
      this.subscription.fire();
    }
  }
  close() {
    if (this.subscription?.closed === false) this.subscription.close();
  }
}
