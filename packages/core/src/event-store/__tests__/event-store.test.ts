import { beforeEach, describe, expect, it, vi } from "vitest";
import { kinds, NostrEvent } from "nostr-tools";
import { subscribeSpyTo } from "@hirez_io/observer-spy";

import { EventStore } from "../event-store.js";
import { addSeenRelay, getSeenRelays } from "../../helpers/relays.js";
import { getEventUID } from "../../helpers/event.js";

let eventStore: EventStore;

beforeEach(() => {
  eventStore = new EventStore();
});

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
const kind1 = {
  content:
    "Except for Substack, what is the simplest way to make a mailing list that can also be browsed on the web?\n\nNo one is doing the Nostr Weekly Report, so maybe I'll start it.",
  created_at: 1739384412,
  id: "00006c0cbf210d920242ab472337e690f21db94116bd905259eebfad5ade7232",
  kind: 1,
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  sig: "6ebd9c34fcdad8ced3ddd9e6eef6e0d0fa77d15d86fe02af33b48dc79714f0f92d3eec77f300ccc8f237217838f9d802bbd65ac7f477705d236dbd99a45c6c34",
  tags: [["nonce", "13835058055282193107", "16"]],
};

describe("add", () => {
  it("should return original event in case of duplicates", () => {
    const a = { ...event };
    expect(eventStore.add(a)).toBe(a);
    const b = { ...event };
    expect(eventStore.add(b)).toBe(a);
    const c = { ...event };
    expect(eventStore.add(c)).toBe(a);
  });

  it("should merge seen relays on duplicate events", () => {
    const a = { ...event };
    addSeenRelay(a, "wss://relay.a.com");
    eventStore.add(a);

    const b = { ...event };
    addSeenRelay(b, "wss://relay.b.com");
    eventStore.add(b);

    expect(eventStore.getEvent(event.id)).toBeDefined();
    expect([...getSeenRelays(eventStore.getEvent(event.id)!)!]).toEqual(
      expect.arrayContaining(["wss://relay.a.com", "wss://relay.b.com"]),
    );
  });

  it("should ignore deleted events", () => {
    const deleteEvent: NostrEvent = {
      id: "delete event id",
      kind: kinds.EventDeletion,
      created_at: event.created_at + 100,
      pubkey: event.pubkey,
      tags: [["e", event.id]],
      sig: "this should be ignored for the test",
      content: "test",
    };

    // add delete event first
    eventStore.add(deleteEvent);

    // now event should be ignored
    eventStore.add(event);

    expect(eventStore.getEvent(event.id)).toBeUndefined();
  });
});

describe("verifyEvent", () => {
  it("should be called for all events added", () => {
    const verifyEvent = vi.fn().mockReturnValue(true);
    eventStore.verifyEvent = verifyEvent;

    eventStore.add(event);
    expect(verifyEvent).toHaveBeenCalledWith(event);
  });

  it("should not be called for duplicate events", () => {
    const verifyEvent = vi.fn().mockReturnValue(true);
    eventStore.verifyEvent = verifyEvent;

    const a = { ...event };
    eventStore.add(a);
    expect(verifyEvent).toHaveBeenCalledWith(a);

    const b = { ...event };
    eventStore.add(b);
    expect(verifyEvent).toHaveBeenCalledTimes(1);
    const c = { ...event };
    eventStore.add(c);
    expect(verifyEvent).toHaveBeenCalledTimes(1);
  });
});

describe("deleted", () => {
  it("should complete when event is removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.removed(event.id));
    eventStore.remove(event);
    expect(spy.getValues()).toEqual([]);
    expect(spy.receivedComplete()).toBe(true);
  });
});

describe("event", () => {
  it("should emit existing event", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.event(event.id));
    expect(spy.getValues()).toEqual([event]);
  });

  it("should emit then event when its added", () => {
    const spy = subscribeSpyTo(eventStore.event(event.id));
    expect(spy.getValues()).toEqual([]);
    eventStore.add(event);
    expect(spy.getValues()).toEqual([event]);
  });

  it("should emit undefined when event is removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.event(event.id));
    expect(spy.getValues()).toEqual([event]);
    eventStore.remove(event);
    expect(spy.getValues()).toEqual([event, undefined]);
  });

  it("should emit new value if event is re-added", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.event(event.id));
    eventStore.remove(event);
    eventStore.add(event);
    expect(spy.getValues()).toEqual([event, undefined, event]);
  });

  it("should not complete when event is removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.event(event.id));
    eventStore.remove(event);
    expect(spy.receivedComplete()).toBe(false);
  });

  it("should not emit any values if there are no events", () => {
    const spy = subscribeSpyTo(eventStore.event(event.id));
    expect(spy.receivedNext()).toBe(false);
  });
});

describe("events", () => {
  it("should emit existing events", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.events([event.id]));
    expect(spy.getValues()).toEqual([{ [event.id]: event }]);
  });

  it("should remove events when they are removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.events([event.id]));
    expect(spy.getValues()).toEqual([{ [event.id]: event }]);

    eventStore.remove(event);
    expect(spy.getValues()).toEqual([{ [event.id]: event }, {}]);
  });

  it("should add events back if then are re-added", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.events([event.id]));
    eventStore.remove(event);
    eventStore.add(event);
    expect(spy.getValues()).toEqual([{ [event.id]: event }, {}, { [event.id]: event }]);
  });

  it("should not emit any values if there are no events", () => {
    const spy = subscribeSpyTo(eventStore.events([event.id]));
    expect(spy.receivedNext()).toBe(false);
  });
});

describe("replaceable", () => {
  it("should not emit till there is an event", () => {
    const spy = subscribeSpyTo(eventStore.replaceable(0, event.pubkey));
    expect(spy.receivedNext()).toBe(false);
  });

  it("should emit existing events", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceable(0, event.pubkey));
    expect(spy.getValues()).toEqual([event]);
  });

  it("should emit undefined when event is removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceable(0, event.pubkey));
    eventStore.remove(event);
    expect(spy.getValues()).toEqual([event, undefined]);
  });

  it("should not complete when event is removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceable(0, event.pubkey));
    eventStore.remove(event);
    expect(spy.receivedComplete()).toBe(false);
  });

  it("should emit event when re-added", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceable(0, event.pubkey));
    eventStore.remove(event);
    eventStore.add(event);
    expect(spy.getValues()).toEqual([event, undefined, event]);
  });

  it("should claim event", () => {
    eventStore.add(event);
    eventStore.replaceable(0, event.pubkey).subscribe();
    expect(eventStore.database.isClaimed(event)).toBe(true);
  });

  it("should remove claim when event is removed", () => {
    eventStore.add(event);
    eventStore.replaceable(0, event.pubkey).subscribe();
    eventStore.remove(event);
    expect(eventStore.database.isClaimed(event)).toBe(false);
  });
});

describe("timeline", () => {
  it("should not emit if there are not events", () => {
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [1] }));
    expect(spy.receivedNext()).toBe(false);
  });

  it("should emit existing events", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    expect(spy.getValues()).toEqual([[event]]);
  });

  it("should emit new events", () => {
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0, 1] }));
    eventStore.add(event);
    eventStore.add(kind1);
    expect(spy.getValues()).toEqual([[event], [kind1, event]]);
  });

  it("should remove event when its removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    eventStore.remove(event);
    expect(spy.getValues()).toEqual([[event], []]);
  });

  it("should not emit when other events are removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    eventStore.add(kind1);
    eventStore.remove(kind1);
    expect(spy.getValues()).toEqual([[event]]);
  });
});

describe("replaceableSet", () => {
  it("should not emit if there are not events", () => {
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: event.pubkey }]));
    expect(spy.receivedNext()).toBe(false);
  });

  it("should emit existing events", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: event.pubkey }]));
    expect(spy.getValues()).toEqual([{ [getEventUID(event)]: event }]);
  });

  it("should remove event when removed", () => {
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: event.pubkey }]));
    eventStore.remove(event);
    expect(spy.getValues()).toEqual([{ [getEventUID(event)]: event }, {}]);
  });

  it("should replace older events", () => {
    const event2 = { ...event, created_at: event.created_at + 100, id: "newer-event" };
    const uid = getEventUID(event);
    eventStore.add(event);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: event.pubkey }]));
    eventStore.add(event2);

    expect(spy.getValues()).toEqual([{ [uid]: event }, { [uid]: event2 }]);
  });
});
