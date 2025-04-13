import { Filter, NostrEvent } from "nostr-tools";
import { Observable } from "rxjs";
import { WebSocketSubject } from "rxjs/webSocket";

export type SubscriptionResponse = NostrEvent | "EOSE";
export type PublishResponse = { ok: boolean; message?: string; from: string };

export type MultiplexWebSocket<T = any> = Pick<WebSocketSubject<T>, "multiplex">;

export interface IRelayState {
  connected$: Observable<boolean>;
  challenge$: Observable<string | null>;
  authenticated$: Observable<boolean>;
  notices$: Observable<string[]>;
}

export interface Nip01Actions {
  /** Send an EVENT message */
  event(event: NostrEvent): Observable<PublishResponse>;
  /** Send a REQ message */
  req(filters: Filter | Filter[], id?: string): Observable<SubscriptionResponse>;
}

export interface IRelay extends MultiplexWebSocket, Nip01Actions, IRelayState {
  url: string;

  message$: Observable<any>;
  notice$: Observable<string>;

  readonly connected: boolean;
  readonly authenticated: boolean;
  readonly challenge: string | null;
  readonly notices: string[];

  /** Send an AUTH message */
  auth(event: NostrEvent): Observable<{ ok: boolean; message?: string }>;
}

export interface IPoolActions {
  /** Send an EVENT message */
  event(relays: string[], event: NostrEvent): Observable<PublishResponse[]>;
  /** Send a REQ message */
  req(relays: string[], filters: Filter | Filter[]): Observable<SubscriptionResponse[]>;
}
