import { createRxOneshotReq, EventPacket, RxNostr } from "rx-nostr";
import { BehaviorSubject, filter, map, mergeMap, share, tap } from "rxjs";
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

  /** set to true when 0 events are returned from last batch */
  eose = false;

  protected log: typeof logger = logger.extend("RelayTimelineLoader");

  constructor(rxNostr: RxNostr, relay: string, filters: TimelessFilter[], opts?: RelayTimelineLoaderOptions) {
    super((source) =>
      source.pipe(
        filter(() => !this.loading && !this.eose),
        map((limit) => {
          // build next batch filters
          return filters.map((filter) => ({
            limit: limit || opts?.limit,
            ...filter,
            // limit curser to now
            until: Math.min(unixNow(), this.cursor),
          })) satisfies Filter[];
        }),
        filter((filters) => filters.length > 0),
        mergeMap((filters) => {
          // make batch request
          let count = 0;
          const req = createRxOneshotReq({ filters, rxReqId: this.id });
          this.loading$.next(true);

          this.log(`Next batch starting at ${filters[0].until} limit ${filters[0].limit}`);

          return rxNostr.use(req, { on: { relays: [relay] } }).pipe(
            tap({
              next: (packet) => {
                // update cursor when event is received
                this.cursor = Math.min(packet.event.created_at, this.cursor);
                count++;
              },
              complete: () => {
                // set loading to false when batch completes
                this.loading$.next(false);
                this.log(`Finished batch, got ${count} events`);

                // set eose if no events where returned
                if (count === 0) this.eose = true;
              },
            }),
          );
        }),
        // share the response with all subscribers
        share(),
      ),
    );

    // create a unique logger for this instance
    this.log = this.log.extend(this.id);
  }
}
