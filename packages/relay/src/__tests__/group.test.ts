import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { NostrEvent } from "nostr-tools";
import { WS } from "vitest-websocket-mock";

import { Relay } from "../relay.js";
import { RelayGroup } from "../group.js";

let mockRelay1: WS;
let mockRelay2: WS;
let relay1: Relay;
let relay2: Relay;
let group: RelayGroup;
let mockEvent: NostrEvent;

beforeEach(async () => {
  mockRelay1 = new WS("wss://relay1.test");
  mockRelay2 = new WS("wss://relay2.test");
  relay1 = new Relay("wss://relay1.test");
  relay2 = new Relay("wss://relay2.test");
  group = new RelayGroup([relay1, relay2]);

  mockEvent = {
    kind: 1,
    id: "test-id",
    pubkey: "test-pubkey",
    created_at: 1234567890,
    tags: [],
    content: "test content",
    sig: "test-sig",
  };
});

afterEach(async () => {
  mockRelay1.close();
  mockRelay2.close();
  await WS.clean();
});

describe("req", () => {
  it("should trigger connections to multiple relays", async () => {
    group.req([{ kinds: [1] }], "test-sub").subscribe();

    const req1 = await mockRelay1.nextMessage;
    const req2 = await mockRelay2.nextMessage;

    expect(JSON.parse(req1 as string)).toEqual(["REQ", "test-sub", { kinds: [1] }]);
    expect(JSON.parse(req2 as string)).toEqual(["REQ", "test-sub", { kinds: [1] }]);
  });

  it("should emit events from all relays", async () => {
    const spy = subscribeSpyTo(group.req([{ kinds: [1] }], "test-sub"));

    mockRelay1.send(JSON.stringify(["EVENT", "test-sub", { ...mockEvent, id: "1" }]));
    mockRelay2.send(JSON.stringify(["EVENT", "test-sub", { ...mockEvent, id: "2" }]));

    expect(spy.getValues()).toEqual([expect.objectContaining({ id: "1" }), expect.objectContaining({ id: "2" })]);
  });

  it("should only emit EOSE once all relays have emitted EOSE", async () => {
    const spy = subscribeSpyTo(group.req([{ kinds: [1] }], "test-sub"));

    mockRelay1.send(JSON.stringify(["EOSE", "test-sub"]));
    expect(spy.getValues()).not.toContain("EOSE");

    mockRelay2.send(JSON.stringify(["EOSE", "test-sub"]));
    expect(spy.getValues()).toContain("EOSE");
  });

  it("should ignore relays that have an error", async () => {
    const spy = subscribeSpyTo(group.req([{ kinds: [1] }], "test-sub"));

    mockRelay1.error();
    mockRelay2.send(JSON.stringify(["EVENT", "test-sub", mockEvent]));
    mockRelay2.send(JSON.stringify(["EOSE", "test-sub"]));

    expect(spy.getValues()).toEqual([expect.objectContaining(mockEvent), "EOSE"]);
  });

  it("should emit EOSE if all relays error", async () => {
    const spy = subscribeSpyTo(group.req([{ kinds: [1] }], "test-sub"));

    mockRelay1.error();
    mockRelay2.error();

    expect(spy.getValues()).toEqual(["EOSE"]);
  });
});

describe("event", () => {
  it("should send EVENT to all relays in the group", async () => {
    group.event(mockEvent).subscribe();

    const event1 = await mockRelay1.nextMessage;
    const event2 = await mockRelay2.nextMessage;

    expect(JSON.parse(event1 as string)).toEqual(["EVENT", mockEvent]);
    expect(JSON.parse(event2 as string)).toEqual(["EVENT", mockEvent]);
  });

  it("should emit OK messages from all relays", async () => {
    const spy = subscribeSpyTo(group.event(mockEvent));

    mockRelay1.send(JSON.stringify(["OK", mockEvent.id, true, ""]));
    mockRelay2.send(JSON.stringify(["OK", mockEvent.id, true, ""]));

    expect(spy.getValues()).toEqual([
      expect.objectContaining({ ok: true, from: "wss://relay1.test", message: "" }),
      expect.objectContaining({ ok: true, from: "wss://relay2.test", message: "" }),
    ]);
  });

  it("should complete when all relays have sent OK messages", async () => {
    const spy = subscribeSpyTo(group.event(mockEvent));

    mockRelay1.send(JSON.stringify(["OK", mockEvent.id, true, ""]));
    expect(spy.receivedComplete()).toBe(false);

    mockRelay2.send(JSON.stringify(["OK", mockEvent.id, true, ""]));
    expect(spy.receivedComplete()).toBe(true);
  });

  it("should handle relay errors and still complete", async () => {
    const spy = subscribeSpyTo(group.event(mockEvent));

    mockRelay1.error();
    mockRelay2.send(JSON.stringify(["OK", mockEvent.id, true, ""]));

    expect(spy.getValues()).toEqual([
      expect.objectContaining({ ok: false, from: "wss://relay1.test", message: "Unknown error" }),
      expect.objectContaining({ ok: true, from: "wss://relay2.test", message: "" }),
    ]);
    expect(spy.receivedComplete()).toBe(true);
  });
});
