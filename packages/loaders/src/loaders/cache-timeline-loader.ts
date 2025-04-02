import { BehaviorSubject, filter, map, mergeMap, tap } from "rxjs";
import { markFromCache, unixNow } from "applesauce-core/helpers";
import { logger } from "applesauce-core";
import { Filter, NostrEvent } from "nostr-tools";
import { nanoid } from "nanoid";

import { CacheRequest, Loader } from "./loader.js";
import { TimelessFilter } from "./relay-timeline-loader.js";

export type CacheTimelineLoaderOptions = {
  /** default number of events to request in each batch */
  limit?: number;
};

/** A loader that can be used to load a timeline in chunks */
export class CacheTimelineLoader extends Loader<number | void, NostrEvent> {
  id = nanoid(8);
  loading$ = new BehaviorSubject(false);
  get loading() {
    return this.loading$.value;
  }

  /** current "until" timestamp */
  cursor = Infinity;

  /** set to true when 0 events are returned from last batch */
  eose = false;

  protected log: typeof logger = logger.extend("CacheTimelineLoader");

  constructor(
    cacheRequest: CacheRequest,
    public filters: TimelessFilter[],
    opts?: CacheTimelineLoaderOptions,
  ) {
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
        // ignore empty filters
        filter((filters) => filters.length > 0),
        mergeMap((filters) => {
          // make batch request
          let count = 0;
          this.loading$.next(true);

          this.log(`Next batch starting at ${filters[0].until} limit ${filters[0].limit}`);

          return cacheRequest(filters).pipe(
            tap({
              next: (event) => {
                // mark event from cache
                markFromCache(event);

                // update cursor when event is received
                this.cursor = Math.min(event.created_at - 1, this.cursor);
                count++;
              },
              complete: () => {
                // set loading to false when batch completes
                this.loading$.next(false);

                // set eose if no events where returned
                if (count === 0) {
                  this.eose = true;
                  this.log(`Got ${count} event, Complete`);
                } else {
                  this.log(`Finished batch, got ${count} events`);
                }
              },
            }),
          );
        }),
      ),
    );

    // create a unique logger for this instance
    this.log = this.log.extend("cache");
  }
}
