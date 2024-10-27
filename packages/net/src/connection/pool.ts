import { SimplePool } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { normalizeURL } from "nostr-tools/utils";
import { fakeVerifyEvent } from "applesauce-core/helpers/event";

export interface IConnectionPool {
  getConnection(url: string | URL): AbstractRelay;
}

export class SimpleConnectionPool extends SimplePool implements IConnectionPool {
  getConnection(url: string | URL): AbstractRelay {
    url = normalizeURL(url.toString());

    let relay = this.relays.get(url);
    if (!relay) {
      relay = new AbstractRelay(url, {
        verifyEvent: this.trustedRelayURLs.has(url) ? fakeVerifyEvent : this.verifyEvent,
        // @ts-expect-error
        websocketImplementation: this._WebSocket,
      });
      this.relays.set(url, relay);
    }

    return relay;
  }
}
