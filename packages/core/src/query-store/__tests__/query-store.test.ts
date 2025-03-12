import { describe, it, expect, beforeEach } from "vitest";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { NostrEvent } from "nostr-tools";

import { EventStore } from "../../event-store/event-store.js";
import { QueryStore } from "../query-store.js";
import { ProfileQuery } from "../../queries/profile.js";
import { SingleEventQuery } from "../../queries/simple.js";

let eventStore: EventStore;
let queryStore: QueryStore;

const event: NostrEvent = {
  content:
    '{"name":"hzrd149","picture":"https://cdn.hzrd149.com/5ed3fe5df09a74e8c126831eac999364f9eb7624e2b86d521521b8021de20bdc.png","about":"JavaScript developer working on some nostr stuff\\n- noStrudel https://nostrudel.ninja/ \\n- Blossom https://github.com/hzrd149/blossom \\n- Applesauce https://hzrd149.github.io/applesauce/","website":"https://hzrd149.com","nip05":"_@hzrd149.com","lud16":"hzrd1499@minibits.cash","pubkey":"266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5","display_name":"hzrd149","displayName":"hzrd149","banner":""}',
  created_at: 1738362529,
  id: "e9df8d5898c4ccfbd21fcd59f3f48abb3ff0ab7259b19570e2f1756de1e9306b",
  kind: 0,
  pubkey: "266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5",
  sig: "465a47b93626a587bf81dadc2b306b8f713a62db31d6ce1533198e9ae1e665a6eaf376a03250bf9ffbb02eb9059c8eafbd37ae1092d05d215757575bd8357586",
  tags: [],
};

beforeEach(() => {
  eventStore = new EventStore();
  queryStore = new QueryStore(eventStore);
});

describe("createQuery", () => {
  it("should emit synchronous value if it exists", () => {
    let value: any = undefined;
    eventStore.add(event);
    queryStore.createQuery(ProfileQuery, event.pubkey).subscribe((v) => (value = v));

    expect(value).not.toBe(undefined);
  });

  it("should not emit undefined if value exists", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(queryStore.createQuery(SingleEventQuery, event.id));

    expect(spy.getValues()).toEqual([event]);
  });

  it("should emit synchronous undefined if value does not exists", () => {
    let value: any = 0;
    queryStore.createQuery(ProfileQuery, event.pubkey).subscribe((v) => {
      value = v;
    });

    expect(value).not.toBe(0);
    expect(value).toBe(undefined);
  });

  it("should share latest value", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(queryStore.createQuery(SingleEventQuery, event.id));
    const spy2 = subscribeSpyTo(queryStore.createQuery(SingleEventQuery, event.id));

    expect(spy.getValues()).toEqual([event]);
    expect(spy2.getValues()).toEqual([event]);
  });
});

describe("executeQuery", () => {
  it("should resolve when value is already present", async () => {
    eventStore.add(event);

    expect(await queryStore.executeQuery(ProfileQuery, event.pubkey)).toEqual(
      expect.objectContaining({ name: "hzrd149" }),
    );
  });

  it("should resolve when value is added to event store", async () => {
    const p = queryStore.executeQuery(ProfileQuery, event.pubkey);

    // delay adding the event
    setTimeout(() => {
      eventStore.add(event);
    }, 10);

    await expect(p).resolves.toEqual(expect.objectContaining({ name: "hzrd149" }));
  });
});
