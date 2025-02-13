import { Subject } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TimeoutError } from "applesauce-core/observable";
import { EventStore, QueryStore } from "applesauce-core";

import { RequestLoader } from "../request-loader.js";

let eventStore: EventStore;
let queryStore: QueryStore;
let loader: RequestLoader;

beforeEach(() => {
  eventStore = new EventStore();
  queryStore = new QueryStore(eventStore);
  loader = new RequestLoader(queryStore);

  // @ts-expect-error
  loader.replaceableLoader = new Subject();
  vi.spyOn(loader.replaceableLoader!, "next").mockImplementation(() => {});
});

describe("profile", () => {
  it("should return a promise that resolves", async () => {
    const p = loader.profile({ pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d" });

    expect(loader.replaceableLoader!.next).toHaveBeenCalledWith(
      expect.objectContaining({ pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d" }),
    );

    eventStore.add({
      content:
        '{"name":"fiatjaf","about":"~","picture":"https://fiatjaf.com/static/favicon.jpg","nip05":"_@fiatjaf.com","lud16":"fiatjaf@zbd.gg","website":"https://nostr.technology"}',
      created_at: 1738588530,
      id: "c43be8b4634298e97dde3020a5e6aeec37d7f5a4b0259705f496e81a550c8f8b",
      kind: 0,
      pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      sig: "202a1bf6a58943d660c1891662dbdda142aa8e5bca9d4a3cb03cde816ad3bdda6f4ec3b880671506c2820285b32218a0afdec2d172de9694d83972190ab4f9da",
      tags: [],
    });

    expect(await p).toEqual(expect.objectContaining({ name: "fiatjaf" }));
  });

  it("should reject with TimeoutError after 10 seconds", async () => {
    // reduce timeout for tests
    loader.requestTimeout = 10;

    await expect(
      loader.profile({ pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d" }),
    ).rejects.toThrow(TimeoutError);
  });
});
