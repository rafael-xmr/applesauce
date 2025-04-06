import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { NostrEvent } from "nostr-tools";
import { WS } from "vitest-websocket-mock";

import { Relay } from "../relay.js";

let mockServer: WS;
let relay: Relay;

beforeEach(async () => {
  mockServer = new WS("wss://test");
  relay = new Relay("wss://test");

  // Create a persistent subscription to keep the connection open
  // @ts-expect-error
  subscribeSpyTo(relay.socket);
});

afterEach(async () => {
  mockServer.close();
  // Wait for server to close to prevent memory leaks
  await WS.clean();
});

const mockEvent: NostrEvent = {
  kind: 1,
  id: "00007641c9c3e65a71843933a44a18060c7c267a4f9169efa3735ece45c8f621",
  pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
  created_at: 1743712795,
  tags: [["nonce", "13835058055282167643", "16"]],
  content: "This is just stupid: https://codestr.fiatjaf.com/",
  sig: "5a57b5a12bba4b7cf0121077b1421cf4df402c5c221376c076204fc4f7519e28ce6508f26ddc132c406ccfe6e62cc6db857b96c788565cdca9674fe9a0710ac2",
};

describe("event", () => {
  it("should wait for auth before sending EVENT if auth-required received", async () => {
    // Create first event subscription
    const spy1 = subscribeSpyTo(relay.event(mockEvent));

    // Verify EVENT was sent
    const firstEventMessage = await mockServer.nextMessage;
    expect(JSON.parse(firstEventMessage as string)).toEqual(["EVENT", mockEvent]);

    // Send auth-required response
    mockServer.send(JSON.stringify(["OK", mockEvent.id, false, "auth-required: need to authenticate"]));

    // Create second event subscription - this should not send EVENT yet
    const spy2 = subscribeSpyTo(relay.event(mockEvent));

    // Should not have received any messages
    expect(mockServer.messages.length).toBe(1);

    // Send AUTH challenge
    mockServer.send(JSON.stringify(["AUTH", "challenge-string"]));

    // Send auth event
    const authEvent = { ...mockEvent, id: "auth-id" };
    subscribeSpyTo(relay.auth(authEvent));

    // Verify AUTH was sent
    const authMessage = await mockServer.nextMessage;
    expect(JSON.parse(authMessage as string)).toEqual(["AUTH", authEvent]);

    // Send successful auth response
    mockServer.send(JSON.stringify(["OK", authEvent.id, true, ""]));

    // Now the second EVENT should be sent
    const secondEventMessage = await mockServer.nextMessage;
    expect(JSON.parse(secondEventMessage as string)).toEqual(["EVENT", mockEvent]);

    // Send OK response for second event
    mockServer.send(JSON.stringify(["OK", mockEvent.id, true, ""]));

    expect(spy1.getLastValue()).toEqual({
      ok: false,
      message: "auth-required: need to authenticate",
      from: "wss://test",
    });
    expect(spy2.getLastValue()).toEqual({ ok: true, message: "", from: "wss://test" });
  });
});

describe("req", () => {
  it("should wait for auth before sending REQ if auth-required received", async () => {
    // Create first REQ subscription
    const filters = [{ kinds: [1], limit: 10 }];
    const spy1 = subscribeSpyTo(relay.req(filters, "sub1"));

    // Verify REQ was sent
    const firstReqMessage = await mockServer.nextMessage;
    expect(JSON.parse(firstReqMessage as string)).toEqual(["REQ", "sub1", ...filters]);

    // Send auth-required response
    mockServer.send(JSON.stringify(["CLOSE", "sub1", "auth-required: need to authenticate"]));

    // Consume the client CLOSE message for sub1
    await mockServer.nextMessage;

    // Create second REQ subscription - this should not send REQ yet
    const spy2 = subscribeSpyTo(relay.req(filters, "sub2"));

    // Should not have received any messages
    expect(mockServer.messages).not.toContain(JSON.stringify(["REQ", "sub2", ...filters]));

    // Send AUTH challenge
    mockServer.send(JSON.stringify(["AUTH", "challenge-string"]));

    // Send auth event
    const authEvent = { ...mockEvent, id: "auth-id" };
    subscribeSpyTo(relay.auth(authEvent));

    // Verify AUTH was sent
    const authMessage = await mockServer.nextMessage;
    expect(JSON.parse(authMessage as string)).toEqual(["AUTH", authEvent]);

    // Send successful auth response
    mockServer.send(JSON.stringify(["OK", authEvent.id, true, ""]));

    // Now the second REQ should be sent
    const secondReqMessage = await mockServer.nextMessage;
    expect(JSON.parse(secondReqMessage as string)).toEqual(["REQ", "sub2", ...filters]);

    // Send some events for the second subscription
    mockServer.send(JSON.stringify(["EVENT", "sub2", mockEvent]));
    mockServer.send(JSON.stringify(["EOSE", "sub2"]));
  });
});

describe("auth", () => {
  it("should set authenticated state after successful AUTH challenge response", async () => {
    // Send AUTH challenge
    mockServer.send(JSON.stringify(["AUTH", "challenge-string"]));

    // Send auth event response
    const authEvent = { ...mockEvent, id: "auth-id" };
    subscribeSpyTo(relay.auth(authEvent));

    // Verify AUTH was sent
    const authMessage = await mockServer.nextMessage;
    expect(JSON.parse(authMessage as string)).toEqual(["AUTH", authEvent]);

    // Send successful auth response
    mockServer.send(JSON.stringify(["OK", authEvent.id, true, ""]));

    expect(relay.authenticated).toBe(true);
  });
});
