import { BehaviorSubject, filter, map, Observable } from "rxjs";
import { logger } from "applesauce-core";
import { nanoid } from "nanoid";
import { unixNow } from "applesauce-core/helpers";
import { Filter, NostrEvent } from "nostr-tools";

import { Loader, NostrRequest } from "./loader.js";
import { completeOnEOSE } from "../operators/complete-on-eose.js";

export type TimelessFilter = Omit<Filter, "since" | "until">;

export type RelayTimelineLoaderOptions = {
  /** default number of events to request in each batch */
  limit?: number;
};

/** A loader that can be used to load a timeline in chunks */
export class RelayTimelineLoader extends Loader<number | void, NostrEvent> {
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
    request: NostrRequest,
    public relay: string,
    public filters: TimelessFilter[],
    opts?: RelayTimelineLoaderOptions,
  ) {
    super(
      (source) =>
        new Observable<NostrEvent>((observer) => {
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
              this.loading$.next(true);

              this.log(`Next batch starting at ${filters[0].until} limit ${filters[0].limit}`);

              request([relay], filters)
                .pipe(completeOnEOSE())
                .subscribe({
                  next: (event) => {
                    // update cursor when event is received
                    this.cursor = Math.min(event.created_at - 1, this.cursor);
                    count++;

                    // forward packet
                    observer.next(event);
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
