import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { getSeenRelays } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { WS } from "vitest-websocket-mock";

import { Relay } from "../relay.js";
import { filter } from "rxjs/operators";
import { firstValueFrom } from "rxjs";

let mockRelay: WS;
let relay: Relay;

beforeEach(async () => {
  mockRelay = new WS("wss://test", { jsonProtocol: true });
  relay = new Relay("wss://test");
  relay.keepAlive = 0;
});

// Wait for server to close to prevent memory leaks
afterEach(async () => {
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

describe("req", () => {
  it("should trigger connection to relay", async () => {
    subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Wait for connection
    await firstValueFrom(relay.connected$.pipe(filter(Boolean)));

    expect(relay.connected).toBe(true);
  });

  it("should send REQ and CLOSE messages", async () => {
    // Create subscription that completes after first EOSE
    const sub = relay.req([{ kinds: [1] }], "sub1").subscribe();

    // Verify REQ was sent
    expect(await mockRelay.nextMessage).toEqual(["REQ", "sub1", { kinds: [1] }]);

    // Send EOSE to complete subscription
    mockRelay.send(["EOSE", "sub1"]);

    // Complete the subscription
    sub.unsubscribe();

    // Verify CLOSE was sent
    expect(await mockRelay.nextMessage).toEqual(["CLOSE", "sub1"]);
  });

  it("should emit nostr event and EOSE", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send EVENT message
    mockRelay.send(["EVENT", "sub1", mockEvent]);

    // Send EOSE message
    mockRelay.send(["EOSE", "sub1"]);

    expect(spy.getValues()).toEqual([expect.objectContaining(mockEvent), "EOSE"]);
  });

  it("should ignore EVENT and EOSE messages that do not match subscription id", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send EVENT message with wrong subscription id
    mockRelay.send(["EVENT", "wrong_sub", mockEvent]);

    // Send EOSE message with wrong subscription id
    mockRelay.send(["EOSE", "wrong_sub"]);

    // Send EVENT message with correct subscription id
    mockRelay.send(["EVENT", "sub1", mockEvent]);

    // Send EOSE message with correct subscription id
    mockRelay.send(["EOSE", "sub1"]);

    expect(spy.getValues()).toEqual([expect.objectContaining(mockEvent), "EOSE"]);
  });

  it("should mark events with their source relay", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send EVENT message
    mockRelay.send(["EVENT", "sub1", mockEvent]);

    // Get the received event
    const receivedEvent = spy.getValues()[0];

    // Verify the event was marked as seen from this relay
    expect(getSeenRelays(receivedEvent)).toContain("wss://test");
  });

  it("should complete subscription when CLOSED message is received", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send CLOSED message for the subscription
    mockRelay.send(["CLOSED", "sub1", "reason"]);

    // Verify the subscription completed
    expect(spy.receivedComplete()).toBe(true);
  });
});

describe("event", () => {
  it("should trigger connection to relay", async () => {
    subscribeSpyTo(relay.event(mockEvent));

    // Wait for connection
    await firstValueFrom(relay.connected$.pipe(filter(Boolean)));

    expect(relay.connected).toBe(true);
  });

  it("observable should complete when matching OK response received", async () => {
    const spy = subscribeSpyTo(relay.event(mockEvent));

    // Verify EVENT message was sent
    expect(await mockRelay.nextMessage).toEqual(["EVENT", mockEvent]);

    // Send matching OK response
    mockRelay.send(["OK", mockEvent.id, true, ""]);

    await spy.onComplete();

    expect(spy.receivedComplete()).toBe(true);
  });

  it("should ignore OK responses for different events", async () => {
    const spy = subscribeSpyTo(relay.event(mockEvent));

    // Send non-matching OK response
    mockRelay.send(["OK", "different_id", true, ""]);

    expect(spy.receivedComplete()).toBe(false);

    // Send matching OK response
    mockRelay.send(["OK", mockEvent.id, true, ""]);

    expect(spy.receivedComplete()).toBe(true);
  });

  it("should send EVENT message to relay", async () => {
    relay.event(mockEvent).subscribe();

    expect(await mockRelay.nextMessage).toEqual(["EVENT", mockEvent]);
  });

  it("should complete with error if no OK received within 10s", async () => {
    vi.useFakeTimers();

    const spy = subscribeSpyTo(relay.event(mockEvent));

    // Fast-forward time by 10 seconds
    await vi.advanceTimersByTimeAsync(10000);

    expect(spy.receivedComplete()).toBe(true);
    expect(spy.getLastValue()).toEqual({ ok: false, from: "wss://test", message: "Timeout" });
  });
});

describe("notices$", () => {
  it("should not trigger connection to relay", async () => {
    subscribeSpyTo(relay.notices$);
    expect(relay.connected).toBe(false);
  });

  it("should accumulate notices in notices$ state", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));
    // Send multiple NOTICE messages
    mockRelay.send(["NOTICE", "Notice 1"]);
    mockRelay.send(["NOTICE", "Notice 2"]);
    mockRelay.send(["NOTICE", "Notice 3"]);

    // Verify the notices state contains all messages
    expect(relay.notices$.value).toEqual(["Notice 1", "Notice 2", "Notice 3"]);
  });

  it("should ignore non-NOTICE messages", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));

    mockRelay.send(["NOTICE", "Important notice"]);
    mockRelay.send(["OTHER", "other message"]);

    // Verify only NOTICE messages are in the state
    expect(relay.notices$.value).toEqual(["Important notice"]);
  });
});

describe("challenge$", () => {
  it("should not trigger connection to relay", async () => {
    subscribeSpyTo(relay.challenge$);
    expect(relay.connected).toBe(false);
  });

  it("should set challenge$ when AUTH message received", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));

    // Send AUTH message with challenge string
    mockRelay.send(["AUTH", "challenge-string-123"]);

    // Verify challenge$ was set
    expect(relay.challenge$.value).toBe("challenge-string-123");
  });

  it("should ignore non-AUTH messages", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));

    mockRelay.send(["NOTICE", "Not a challenge"]);
    mockRelay.send(["OTHER", "other message"]);

    // Verify challenge$ remains null
    expect(relay.challenge$.value).toBe(null);
  });
});

// describe("keepAlive", () => {
//   it("should close the socket connection after keepAlive timeout", async () => {
//     vi.useFakeTimers();

//     // Set a short keepAlive timeout for testing
//     relay.keepAlive = 100; // 100ms for quick testing

//     // Subscribe to the relay to ensure it is active
//     const sub = subscribeSpyTo(relay.req([{ kinds: [1] }]));

//     // Wait for connection
//     await firstValueFrom(relay.connected$.pipe(filter(Boolean)));

//     // Close the subscription
//     sub.unsubscribe();

//     // Fast-forward time by 10ms
//     await vi.advanceTimersByTimeAsync(10);

//     // should still be connected
//     expect(relay.connected).toBe(true);

//     // Wait for the keepAlive timeout to elapse
//     await vi.advanceTimersByTimeAsync(150);

//     expect(relay.connected).toBe(false);
//   });
// });
