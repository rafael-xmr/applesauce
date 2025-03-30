import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  merge,
  NEVER,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  takeWhile,
  tap,
  timeout,
} from "rxjs";
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from "rxjs/webSocket";
import { type Filter, type NostrEvent } from "nostr-tools";
import { nanoid } from "nanoid";
import { logger } from "applesauce-core";

import { markFromRelay } from "./operators/mark-from-relay.js";
import { IRelay, PublishResponse, SubscriptionResponse } from "./types.js";

export type RelayOptions = {
  WebSocket?: WebSocketSubjectConfig<any>["WebSocketCtor"];
};

export class Relay implements IRelay {
  protected log: typeof logger = logger.extend("Relay");
  public socket$: WebSocketSubject<any>;

  connected$ = new BehaviorSubject(false);
  challenge$: Observable<string>;
  authenticated$ = new BehaviorSubject(false);
  notice$: Observable<string>;

  protected authRequiredForReq = new BehaviorSubject(false);
  protected authRequiredForPublish = new BehaviorSubject(false);

  protected reset() {
    // NOTE: only update the values if they need to be changed, otherwise this will cause an infinite loop
    if (this.authenticated$.value) this.authenticated$.next(false);
    if (this.authRequiredForReq.value) this.authRequiredForReq.next(false);
    if (this.authRequiredForPublish.value) this.authRequiredForPublish.next(false);
  }

  constructor(
    public url: string,
    opts?: RelayOptions,
  ) {
    this.log = this.log.extend(url);

    this.socket$ = webSocket({
      url,
      openObserver: {
        next: () => {
          this.log("Connected");
          this.connected$.next(true);
          this.reset();
        },
      },
      closeObserver: {
        next: () => {
          this.log("Disconnected");
          this.connected$.next(false);
          this.reset();
        },
      },
      WebSocketCtor: opts?.WebSocket,
    });

    // create an observable for listening for AUTH
    this.challenge$ = this.socket$.pipe(
      // listen for AUTH messages
      filter((message) => message[0] === "AUTH"),
      // pick the challenge string out
      map((m) => m[1]),
      // cache and share the challenge
      shareReplay(1),
    );

    this.notice$ = this.socket$.pipe(
      // listen for NOTICE messages
      filter((m) => m[0] === "NOTICE"),
      // pick the string out of the message
      map((m) => m[1]),
    );
  }

  protected waitForAuth<T extends unknown = unknown>(
    requireAuth: Observable<boolean>,
    observable: Observable<T>,
  ): Observable<T> {
    return combineLatest([requireAuth, this.authenticated$]).pipe(
      // return EMPTY if auth is required and not authenticated
      switchMap(([required, authenticated]) => {
        if (required && !authenticated) return NEVER;
        else return observable;
      }),
    );
  }

  multiplex<T>(open: () => any, close: () => any, filter: (message: any) => boolean): Observable<T> {
    return this.socket$.multiplex(open, close, filter);
  }

  req(filters: Filter | Filter[], id = nanoid()): Observable<SubscriptionResponse> {
    return this.waitForAuth(
      this.authRequiredForReq,
      this.socket$
        .multiplex(
          () => (Array.isArray(filters) ? ["REQ", id, ...filters] : ["REQ", id, filters]),
          () => ["CLOSE", id],
          (message) => (message[0] === "EVENT" || message[0] === "CLOSE" || message[0] === "EOSE") && message[1] === id,
        )
        .pipe(
          // listen for CLOSE auth-required
          tap((m) => {
            if (m[0] === "CLOSE" && m[1].startsWith("auth-required") && !this.authRequiredForReq.value) {
              this.authRequiredForReq.next(true);
            }
          }),
          // complete when CLOSE is sent
          takeWhile((m) => m[0] !== "CLOSE"),
          // pick event out of EVENT messages
          map<any[], SubscriptionResponse>((message) => {
            if (message[0] === "EOSE") return "EOSE";
            else return message[2] as NostrEvent;
          }),
          // mark events as from relays
          markFromRelay(this.url),
          // if no events are seen in 10s, emit EOSE
          // TODO: this should emit EOSE event if events are seen, the timeout should be for only the EOSE message
          timeout({
            first: 10_000,
            with: () => merge(of<SubscriptionResponse>("EOSE"), NEVER),
          }),
        ),
    );
  }

  /** send an Event message */
  event(event: NostrEvent, verb: "EVENT" | "AUTH" = "EVENT"): Observable<PublishResponse> {
    const observable = this.socket$
      .multiplex(
        () => [verb, event],
        () => void 0,
        (m) => m[0] === "OK" && m[1] === event.id,
      )
      .pipe(
        // format OK message
        map((m) => ({ ok: m[2], message: m[3], from: this.url })),
        // complete on first value
        take(1),
        // listen for OK auth-required
        tap(({ ok, message }) => {
          if (ok === false && message.startsWith("auth-required") && !this.authRequiredForPublish.value) {
            this.authRequiredForPublish.next(true);
          }
        }),
      );

    // skip wait for auth if verb is AUTH
    if (verb === "AUTH") return observable;
    else return this.waitForAuth(this.authRequiredForPublish, observable);
  }

  /** send and AUTH message */
  auth(event: NostrEvent): Observable<{ ok: boolean; message?: string }> {
    return this.event(event, "AUTH").pipe(
      // update authenticated
      tap((result) => this.authenticated$.next(result.ok)),
    );
  }
}
