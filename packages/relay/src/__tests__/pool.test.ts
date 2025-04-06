import { test, expect, beforeEach, afterEach } from "vitest";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { WS } from "vitest-websocket-mock";
import { Filter, NostrEvent } from "nostr-tools";

import { RelayPool } from "../pool.js";

let pool: RelayPool;
let mockServer1: WS;
let mockServer2: WS;

let mockEvent: NostrEvent;

beforeEach(async () => {
  // Create mock WebSocket servers
  mockServer1 = new WS("wss://relay1.example.com");
  mockServer2 = new WS("wss://relay2.example.com");
  pool = new RelayPool();

  mockEvent = {
    kind: 1,
    id: "test-id",
    pubkey: "test-pubkey",
    created_at: 1743712795,
    tags: [],
    content: "test content",
    sig: "test-sig",
  };
});

afterEach(async () => {
  mockServer1.close();
  mockServer2.close();
  // Clean up WebSocket mocks
  await WS.clean();
});

test("creates new relay connections", () => {
  const url = "wss://relay1.example.com";
  const relay = pool.relay(url);

  expect(relay).toBeDefined();
  expect(pool.relays.get(url)).toBe(relay);
});

test("returns existing relay connection if already exists", () => {
  const url = "wss://relay1.example.com";
  const relay1 = pool.relay(url);
  const relay2 = pool.relay(url);

  expect(relay1).toBe(relay2);
  expect(pool.relays.size).toBe(1);
});

test("creates relay group with multiple relays", () => {
  const urls = ["wss://relay1.example.com", "wss://relay2.example.com"];
  const group = pool.group(urls);

  expect(group).toBeDefined();
  expect(pool.groups.get(urls.sort().join(","))).toBe(group);
});

test("req method sends subscription to multiple relays", async () => {
  const urls = ["wss://relay1.example.com", "wss://relay2.example.com"];
  const filters: Filter = { kinds: [1] };

  const spy = subscribeSpyTo(pool.req(urls, filters));

  // Verify REQ was sent to both relays
  const req1 = await mockServer1.nextMessage;
  const req2 = await mockServer2.nextMessage;

  // Both messages should be REQ messages with the same filter
  expect(JSON.parse(req1 as string)[0]).toBe("REQ");
  expect(JSON.parse(req2 as string)[0]).toBe("REQ");
  expect(JSON.parse(req1 as string)[2]).toEqual(filters);
  expect(JSON.parse(req2 as string)[2]).toEqual(filters);

  // Send EVENT from first relay
  mockServer1.send(JSON.stringify(["EVENT", JSON.parse(req1 as string)[1], mockEvent]));

  // Send EOSE from both relays
  mockServer1.send(JSON.stringify(["EOSE", JSON.parse(req1 as string)[1]]));
  mockServer2.send(JSON.stringify(["EOSE", JSON.parse(req2 as string)[1]]));

  expect(spy.getValues()).toContainEqual(expect.objectContaining(mockEvent));
});

test("event method publishes to multiple relays", async () => {
  const urls = ["wss://relay1.example.com", "wss://relay2.example.com"];

  const spy = subscribeSpyTo(pool.event(urls, mockEvent));

  // Verify EVENT was sent to both relays
  const event1 = await mockServer1.nextMessage;
  const event2 = await mockServer2.nextMessage;

  expect(JSON.parse(event1 as string)).toEqual(["EVENT", mockEvent]);
  expect(JSON.parse(event2 as string)).toEqual(["EVENT", mockEvent]);

  // Send OK responses from both relays
  mockServer1.send(JSON.stringify(["OK", mockEvent.id, true, ""]));
  mockServer2.send(JSON.stringify(["OK", mockEvent.id, true, ""]));

  expect(spy.getValues()).toContainEqual({ ok: true, from: "wss://relay1.example.com", message: "" });
  expect(spy.getValues()).toContainEqual({ ok: true, from: "wss://relay2.example.com", message: "" });
});
