import { createRxOneshotReq, EventPacket, RxNostr } from "rx-nostr";
import { BehaviorSubject, filter, map, Observable } from "rxjs";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";
import { unixNow } from "applesauce-core/helpers";
import { Filter } from "nostr-tools";

import { Loader } from "./loader.js";

export type TimelessFilter = Omit<Filter, "since" | "until">;

export type RelayTimelineLoaderOptions = {
  /** default number of events to request in each batch */
  limit?: number;
};

/** A loader that can be used to load a timeline in chunks */
export class RelayTimelineLoader extends Loader<number | void, EventPacket> {
  id = nanoid(8);
  loading$ = new BehaviorSubject(false);
  get loading() {
    return this.loading$.value;
  }

  /** current "until" timestamp */
  cursor = Infinity;

  /** if the timeline is complete */
  complete = false;

  protected log: typeof logger = logger.extend("RelayTimelineLoader");

  constructor(
    rxNostr: RxNostr,
    public relay: string,
    public filters: TimelessFilter[],
    opts?: RelayTimelineLoaderOptions,
  ) {
    super(
      (source) =>
        new Observable((observer) => {
          return source
            .pipe(
              filter(() => !this.loading && !this.complete),
              map((limit) => {
                // build next batch filters
                return filters.map((filter) => ({
                  limit: limit || opts?.limit,
                  ...filter,
                  // limit curser to now
                  until: Math.min(unixNow(), this.cursor),
                })) satisfies Filter[];
              }),
              // ignore empty filters
              filter((filters) => filters.length > 0),
            )
            .subscribe((filters) => {
              // make batch request
              let count = 0;
              const req = createRxOneshotReq({ filters, rxReqId: this.id });
              this.loading$.next(true);

              this.log(`Next batch starting at ${filters[0].until} limit ${filters[0].limit}`);

              rxNostr.use(req, { on: { relays: [relay] } }).subscribe({
                next: (packet) => {
                  // update cursor when event is received
                  this.cursor = Math.min(packet.event.created_at - 1, this.cursor);
                  count++;

                  // forward packet
                  observer.next(packet);
                },
                error: (err) => observer.error(err),
                complete: () => {
                  // set loading to false when batch completes
                  this.loading$.next(false);

                  // set complete the observable if 0 events where returned
                  if (count === 0) {
                    observer.complete();
                    this.log(`Got ${count} event, Complete`);
                  } else {
                    this.log(`Finished batch, got ${count} events`);
                  }
                },
              });
            });
        }),
    );

    // create a unique logger for this instance
    this.log = this.log.extend(relay);
  }
}
