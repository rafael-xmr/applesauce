import { beforeEach, describe, expect, it, vi } from "vitest";
import { kinds, NostrEvent } from "nostr-tools";
import { subscribeSpyTo } from "@hirez_io/observer-spy";

import { EventStore } from "../event-store.js";
import { addSeenRelay, getSeenRelays } from "../../helpers/relays.js";
import { getEventUID } from "../../helpers/event.js";
import { FakeUser } from "../../__tests__/fixtures.js";

let eventStore: EventStore;

beforeEach(() => {
  eventStore = new EventStore();
});

const user = new FakeUser();
const profile = user.profile({ name: "fake user" });
const note = user.note();

describe("add", () => {
  it("should return original event in case of duplicates", () => {
    const a = { ...profile };
    expect(eventStore.add(a)).toBe(a);
    const b = { ...profile };
    expect(eventStore.add(b)).toBe(a);
    const c = { ...profile };
    expect(eventStore.add(c)).toBe(a);
  });

  it("should merge seen relays on duplicate events", () => {
    const a = { ...profile };
    addSeenRelay(a, "wss://relay.a.com");
    eventStore.add(a);

    const b = { ...profile };
    addSeenRelay(b, "wss://relay.b.com");
    eventStore.add(b);

    expect(eventStore.getEvent(profile.id)).toBeDefined();
    expect([...getSeenRelays(eventStore.getEvent(profile.id)!)!]).toEqual(
      expect.arrayContaining(["wss://relay.a.com", "wss://relay.b.com"]),
    );
  });

  it("should ignore deleted events", () => {
    const deleteEvent: NostrEvent = {
      id: "delete event id",
      kind: kinds.EventDeletion,
      created_at: profile.created_at + 100,
      pubkey: user.pubkey,
      tags: [["e", profile.id]],
      sig: "this should be ignored for the test",
      content: "test",
    };

    // add delete event first
    eventStore.add(deleteEvent);

    // now event should be ignored
    eventStore.add(profile);

    expect(eventStore.getEvent(profile.id)).toBeUndefined();
  });
});

describe("verifyEvent", () => {
  it("should be called for all events added", () => {
    const verifyEvent = vi.fn().mockReturnValue(true);
    eventStore.verifyEvent = verifyEvent;

    eventStore.add(profile);
    expect(verifyEvent).toHaveBeenCalledWith(profile);
  });

  it("should not be called for duplicate events", () => {
    const verifyEvent = vi.fn().mockReturnValue(true);
    eventStore.verifyEvent = verifyEvent;

    const a = { ...profile };
    eventStore.add(a);
    expect(verifyEvent).toHaveBeenCalledWith(a);

    const b = { ...profile };
    eventStore.add(b);
    expect(verifyEvent).toHaveBeenCalledTimes(1);
    const c = { ...profile };
    eventStore.add(c);
    expect(verifyEvent).toHaveBeenCalledTimes(1);
  });
});

describe("deleted", () => {
  it("should complete when event is removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.removed(profile.id));
    eventStore.remove(profile);
    expect(spy.getValues()).toEqual([]);
    expect(spy.receivedComplete()).toBe(true);
  });
});

describe("event", () => {
  it("should emit existing event", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.event(profile.id));
    expect(spy.getValues()).toEqual([profile]);
  });

  it("should emit then event when its added", () => {
    const spy = subscribeSpyTo(eventStore.event(profile.id));
    expect(spy.getValues()).toEqual([]);
    eventStore.add(profile);
    expect(spy.getValues()).toEqual([profile]);
  });

  it("should emit undefined when event is removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.event(profile.id));
    expect(spy.getValues()).toEqual([profile]);
    eventStore.remove(profile);
    expect(spy.getValues()).toEqual([profile, undefined]);
  });

  it("should emit new value if event is re-added", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.event(profile.id));
    eventStore.remove(profile);
    eventStore.add(profile);
    expect(spy.getValues()).toEqual([profile, undefined, profile]);
  });

  it("should not complete when event is removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.event(profile.id));
    eventStore.remove(profile);
    expect(spy.receivedComplete()).toBe(false);
  });

  it("should not emit any values if there are no events", () => {
    const spy = subscribeSpyTo(eventStore.event(profile.id));
    expect(spy.receivedNext()).toBe(false);
  });
});

describe("events", () => {
  it("should emit existing events", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.events([profile.id]));
    expect(spy.getValues()).toEqual([{ [profile.id]: profile }]);
  });

  it("should remove events when they are removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.events([profile.id]));
    expect(spy.getValues()).toEqual([{ [profile.id]: profile }]);

    eventStore.remove(profile);
    expect(spy.getValues()).toEqual([{ [profile.id]: profile }, {}]);
  });

  it("should add events back if then are re-added", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.events([profile.id]));
    eventStore.remove(profile);
    eventStore.add(profile);
    expect(spy.getValues()).toEqual([{ [profile.id]: profile }, {}, { [profile.id]: profile }]);
  });

  it("should not emit any values if there are no events", () => {
    const spy = subscribeSpyTo(eventStore.events([profile.id]));
    expect(spy.receivedNext()).toBe(false);
  });
});

describe("replaceable", () => {
  it("should not emit till there is an event", () => {
    const spy = subscribeSpyTo(eventStore.replaceable(0, user.pubkey));
    expect(spy.receivedNext()).toBe(false);
  });

  it("should emit existing events", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceable(0, user.pubkey));
    expect(spy.getValues()).toEqual([profile]);
  });

  it("should emit undefined when event is removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceable(0, user.pubkey));
    eventStore.remove(profile);
    expect(spy.getValues()).toEqual([profile, undefined]);
  });

  it("should not complete when event is removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceable(0, user.pubkey));
    eventStore.remove(profile);
    expect(spy.receivedComplete()).toBe(false);
  });

  it("should emit event when re-added", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceable(0, user.pubkey));
    eventStore.remove(profile);
    eventStore.add(profile);
    expect(spy.getValues()).toEqual([profile, undefined, profile]);
  });

  it("should claim event", () => {
    eventStore.add(profile);
    eventStore.replaceable(0, user.pubkey).subscribe();
    expect(eventStore.database.isClaimed(profile)).toBe(true);
  });

  it("should remove claim when event is removed", () => {
    eventStore.add(profile);
    eventStore.replaceable(0, user.pubkey).subscribe();
    eventStore.remove(profile);
    expect(eventStore.database.isClaimed(profile)).toBe(false);
  });

  it("should ignore older events added later", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceable(0, user.pubkey));
    eventStore.add(user.profile({ name: "old name" }, { created_at: profile.created_at - 500 }));
    eventStore.add(user.profile({ name: "really old name" }, { created_at: profile.created_at - 1000 }));
    expect(spy.getValues()).toEqual([profile]);
  });
});

describe("timeline", () => {
  it("should not emit if there are not events", () => {
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [1] }));
    expect(spy.receivedNext()).toBe(false);
  });

  it("should emit existing events", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    expect(spy.getValues()).toEqual([[profile]]);
  });

  it("should emit new events", () => {
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0, 1] }));
    eventStore.add(profile);
    eventStore.add(note);
    expect(spy.getValues()).toEqual([[profile], [note, profile]]);
  });

  it("should remove event when its removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    eventStore.remove(profile);
    expect(spy.getValues()).toEqual([[profile], []]);
  });

  it("should not emit when other events are removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    eventStore.add(note);
    eventStore.remove(note);
    expect(spy.getValues()).toEqual([[profile]]);
  });

  it("should ignore older events added later", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.timeline({ kinds: [0] }));
    eventStore.add(user.profile({ name: "old-name" }, { created_at: profile.created_at - 1000 }));
    expect(spy.getValues()).toEqual([[profile]]);
  });
});

describe("replaceableSet", () => {
  it("should not emit if there are not events", () => {
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: user.pubkey }]));
    expect(spy.receivedNext()).toBe(false);
  });

  it("should emit existing events", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: user.pubkey }]));
    expect(spy.getValues()).toEqual([{ [getEventUID(profile)]: profile }]);
  });

  it("should remove event when removed", () => {
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: user.pubkey }]));
    eventStore.remove(profile);
    expect(spy.getValues()).toEqual([{ [getEventUID(profile)]: profile }, {}]);
  });

  it("should replace older events", () => {
    const event2 = { ...profile, created_at: profile.created_at + 100, id: "newer-event" };
    const uid = getEventUID(profile);
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: user.pubkey }]));
    eventStore.add(event2);

    expect(spy.getValues()).toEqual([{ [uid]: profile }, { [uid]: event2 }]);
  });

  it("should ignore old events added later", () => {
    const old = user.profile({ name: "old-name" }, { created_at: profile.created_at - 1000 });
    const uid = getEventUID(profile);
    eventStore.add(profile);
    const spy = subscribeSpyTo(eventStore.replaceableSet([{ kind: 0, pubkey: user.pubkey }]));
    eventStore.add(old);

    expect(spy.getValues()).toEqual([{ [uid]: profile }]);
  });
});
