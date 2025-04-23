import { logger } from "applesauce-core";
import { nanoid } from "nanoid";
import { type Filter, type NostrEvent } from "nostr-tools";
import {
  BehaviorSubject,
  combineLatest,
  defer,
  filter,
  ignoreElements,
  map,
  merge,
  NEVER,
  Observable,
  of,
  scan,
  share,
  switchMap,
  take,
  takeWhile,
  tap,
  timeout,
  timer
} from "rxjs";
import { webSocket, WebSocketSubject, WebSocketSubjectConfig } from "rxjs/webSocket";

import { markFromRelay } from "./operators/mark-from-relay.js";
import { IRelay, PublishResponse, SubscriptionResponse } from "./types.js";

export type RelayOptions = {
  WebSocket?: WebSocketSubjectConfig<any>["WebSocketCtor"];
};

export class Relay implements IRelay {
  protected log: typeof logger = logger.extend("Relay");
  protected socket: WebSocketSubject<any>;

  connected$ = new BehaviorSubject(false);
  challenge$ = new BehaviorSubject<string | null>(null);
  authenticated$ = new BehaviorSubject(false);
  notices$ = new BehaviorSubject<string[]>([]);

  /** An observable of all messages from the relay */
  message$: Observable<any>;

  /** An observable of NOTICE messages from the relay */
  notice$: Observable<string>;

  // sync state
  get connected() {
    return this.connected$.value;
  }
  get challenge() {
    return this.challenge$.value;
  }
  get notices() {
    return this.notices$.value;
  }
  get authenticated() {
    return this.authenticated$.value;
  }

  /** If an EOSE message is not seen in this time, emit one locally  */
  eoseTimeout = 10_000;
  /** How long to wait for an OK message from the relay */
  eventTimeout = 10_000;

  /** How long to keep the connection alive after nothing is subscribed */
  keepAlive = 30_000;

  protected authRequiredForReq = new BehaviorSubject(false);
  protected authRequiredForPublish = new BehaviorSubject(false);

  protected resetState() {
    // NOTE: only update the values if they need to be changed, otherwise this will cause an infinite loop
    if (this.challenge$.value !== null) this.challenge$.next(null);
    if (this.authenticated$.value) this.authenticated$.next(false);
    if (this.notices$.value.length > 0) this.notices$.next([]);

    if (this.authRequiredForReq.value) this.authRequiredForReq.next(false);
    if (this.authRequiredForPublish.value) this.authRequiredForPublish.next(false);
  }

  /** An internal observable that is responsible for watching all messages and updating state */
  protected watchTower: Observable<never>;

  constructor(
    public url: string,
    opts?: RelayOptions,
  ) {
    this.log = this.log.extend(url);

    this.socket = webSocket({
      url,
      openObserver: {
        next: () => {
          this.log("Connected");
          this.connected$.next(true);
          this.resetState();
        },
      },
      closeObserver: {
        next: () => {
          this.log("Disconnected");
          this.connected$.next(false);
          this.resetState();
        },
      },
      WebSocketCtor: opts?.WebSocket,
    });

    this.message$ = this.socket.asObservable();

    this.notice$ = this.message$.pipe(
      // listen for NOTICE messages
      filter((m) => m[0] === "NOTICE"),
      // pick the string out of the message
      map((m) => m[1]),
    );

    // Update the notices state
    const notice = this.notice$.pipe(
      // Track all notices
      scan((acc, notice) => [...acc, notice], [] as string[]),
      // Update the notices state
      tap((notices) => this.notices$.next(notices)),
    );

    // Update the challenge state
    const challenge = this.message$.pipe(
      // listen for AUTH messages
      filter((message) => message[0] === "AUTH"),
      // pick the challenge string out
      map((m) => m[1]),
      // Update the challenge state
      tap((challenge) => {
        this.log("Received AUTH challenge", challenge);
        this.challenge$.next(challenge);
      }),
    );

    // Merge all watchers
    this.watchTower = merge(notice, challenge).pipe(
      // Never emit any values
      ignoreElements(),
      // There should only be a single watch tower
      share({ resetOnRefCountZero: () => timer(this.keepAlive) }),
    );
  }

  protected waitForAuth<T extends unknown = unknown>(
    // NOTE: require BehaviorSubject so it always has a value
    requireAuth: BehaviorSubject<boolean>,
    observable: Observable<T>,
  ): Observable<T> {
    return combineLatest([requireAuth, this.authenticated$]).pipe(
      // wait for auth not required or authenticated
      filter(([required, authenticated]) => !required || authenticated),
      // take the first value
      take(1),
      // switch to the observable
      switchMap(() => observable),
    );
  }

  multiplex<T>(open: () => any, close: () => any, filter: (message: any) => boolean): Observable<T> {
    return this.socket.multiplex(open, close, filter);
  }

  /** Send a message to the relay */
  next(message: any) {
    this.socket.next(message);
  }

  /** Create a REQ observable that emits events | "EOSE" or errors */
  req(filters: Filter | Filter[], id = nanoid()): Observable<SubscriptionResponse> {
    const request = this.socket.multiplex(
      () => (Array.isArray(filters) ? ["REQ", id, ...filters] : ["REQ", id, filters]),
      () => ["CLOSE", id],
      (message) => (message[0] === "EVENT" || message[0] === "CLOSED" || message[0] === "EOSE") && message[1] === id,
    );

    // Start the watch tower with the observable
    const withWatchTower = merge(this.watchTower, request);

    const observable = withWatchTower.pipe(
      // listen for CLOSED auth-required
      tap((m) => {
        if (m[0] === "CLOSED" && m[2] && m[2].startsWith("auth-required") && !this.authRequiredForReq.value) {
          this.log("Auth required for REQ");
          this.authRequiredForReq.next(true);
        }
      }),
      // complete when CLOSE is sent
      takeWhile((m) => m[0] !== "CLOSED"),
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
        first: this.eoseTimeout,
        with: () => merge(of<SubscriptionResponse>("EOSE"), NEVER),
      }),
    );

    // Wait for auth if required and make sure to start the watch tower
    return this.waitForAuth(this.authRequiredForReq, observable);
  }

  /** send an Event message and always return an observable of PublishResponse that completes or errors */
  event(event: NostrEvent, verb: "EVENT" | "AUTH" = "EVENT"): Observable<PublishResponse> {
    const base: Observable<PublishResponse> = defer(() => {
      // Send event when subscription starts
      this.socket.next([verb, event]);

      return this.socket.pipe(
        filter((m) => m[0] === "OK" && m[1] === event.id),
        // format OK message
        map((m) => ({ ok: m[2] as boolean, message: m[3] as string, from: this.url })),
      );
    });

    // Start the watch tower with the observable
    const withWatchTower = merge(this.watchTower, base);

    // Add complete operators
    const observable = withWatchTower.pipe(
      // complete on first value
      take(1),
      // listen for OK auth-required
      tap(({ ok, message }) => {
        if (ok === false && message?.startsWith("auth-required") && !this.authRequiredForPublish.value) {
          this.log("Auth required for publish");
          this.authRequiredForPublish.next(true);
        }
      }),
      // if no message is seen in 10s, emit EOSE
      timeout({
        first: this.eventTimeout,
        with: () => of<PublishResponse>({ ok: false, from: this.url, message: "Timeout" }),
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
