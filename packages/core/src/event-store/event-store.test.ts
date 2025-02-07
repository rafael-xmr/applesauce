import { beforeEach, describe, expect, it, vi } from "vitest";
import { kinds, NostrEvent } from "nostr-tools";

import { EventStore } from "./event-store.js";
import { addSeenRelay, getSeenRelays } from "../helpers/relays.js";

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
