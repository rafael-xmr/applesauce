import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { subscribeSpyTo } from "@hirez_io/observer-spy";
import { getSeenRelays } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { WS } from "vitest-websocket-mock";

import { Relay } from "../relay.js";

let mockRelay: WS;
let relay: Relay;

beforeEach(async () => {
  mockRelay = new WS("wss://test");
  relay = new Relay("wss://test");
});

afterEach(async () => {
  mockRelay.close();
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

describe("req", () => {
  it("should send REQ and CLOSE messages", async () => {
    // Create subscription that completes after first EOSE
    const sub = relay.req([{ kinds: [1] }], "sub1").subscribe();

    // Verify REQ was sent
    const reqMessage = await mockRelay.nextMessage;
    expect(JSON.parse(reqMessage as string)).toEqual(["REQ", "sub1", { kinds: [1] }]);

    // Send EOSE to complete subscription
    mockRelay.send(JSON.stringify(["EOSE", "sub1"]));

    // Complete the subscription
    sub.unsubscribe();

    // Verify CLOSE was sent
    const closeMessage = await mockRelay.nextMessage;
    expect(JSON.parse(closeMessage as string)).toEqual(["CLOSE", "sub1"]);
  });

  it("should emit nostr event and EOSE", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send EVENT message
    mockRelay.send(JSON.stringify(["EVENT", "sub1", mockEvent]));

    // Send EOSE message
    mockRelay.send(JSON.stringify(["EOSE", "sub1"]));

    expect(spy.getValues()).toEqual([expect.objectContaining(mockEvent), "EOSE"]);
  });

  it("should ignore EVENT and EOSE messages that do not match subscription id", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send EVENT message with wrong subscription id
    mockRelay.send(JSON.stringify(["EVENT", "wrong_sub", mockEvent]));

    // Send EOSE message with wrong subscription id
    mockRelay.send(JSON.stringify(["EOSE", "wrong_sub"]));

    // Send EVENT message with correct subscription id
    mockRelay.send(JSON.stringify(["EVENT", "sub1", mockEvent]));

    // Send EOSE message with correct subscription id
    mockRelay.send(JSON.stringify(["EOSE", "sub1"]));

    expect(spy.getValues()).toEqual([expect.objectContaining(mockEvent), "EOSE"]);
  });

  it("should mark events with their source relay", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send EVENT message
    mockRelay.send(JSON.stringify(["EVENT", "sub1", mockEvent]));

    // Get the received event
    const receivedEvent = spy.getValues()[0];

    // Verify the event was marked as seen from this relay
    expect(getSeenRelays(receivedEvent)).toContain("wss://test");
  });

  it("should complete subscription when CLOSED message is received", async () => {
    const spy = subscribeSpyTo(relay.req([{ kinds: [1] }], "sub1"));

    // Send CLOSED message for the subscription
    mockRelay.send(JSON.stringify(["CLOSED", "sub1", "reason"]));

    // Verify the subscription completed
    expect(spy.receivedComplete()).toBe(true);
  });
});

describe("event", () => {
  it("observable should complete when matching OK response received", async () => {
    const spy = subscribeSpyTo(relay.event(mockEvent));

    // Verify EVENT message was sent
    const eventMessage = await mockRelay.nextMessage;
    expect(JSON.parse(eventMessage as string)).toEqual(["EVENT", mockEvent]);

    // Send matching OK response
    mockRelay.send(JSON.stringify(["OK", mockEvent.id, true, ""]));

    await spy.onComplete();

    expect(spy.receivedComplete()).toBe(true);
  });

  it("should ignore OK responses for different events", async () => {
    const spy = subscribeSpyTo(relay.event(mockEvent));

    // Send non-matching OK response
    mockRelay.send(JSON.stringify(["OK", "different_id", true, ""]));

    expect(spy.receivedComplete()).toBe(false);

    // Send matching OK response
    mockRelay.send(JSON.stringify(["OK", mockEvent.id, true, ""]));

    expect(spy.receivedComplete()).toBe(true);
  });

  it("should send EVENT message to relay", async () => {
    relay.event(mockEvent).subscribe();

    const eventMessage = await mockRelay.nextMessage;
    expect(JSON.parse(eventMessage as string)).toEqual(["EVENT", mockEvent]);
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

describe("notice$", () => {
  it("should accumulate notices in notices$ state", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));
    // Send multiple NOTICE messages
    mockRelay.send(JSON.stringify(["NOTICE", "Notice 1"]));
    mockRelay.send(JSON.stringify(["NOTICE", "Notice 2"]));
    mockRelay.send(JSON.stringify(["NOTICE", "Notice 3"]));

    // Verify the notices state contains all messages
    expect(relay.notices$.value).toEqual(["Notice 1", "Notice 2", "Notice 3"]);
  });

  it("should ignore non-NOTICE messages", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));

    mockRelay.send(JSON.stringify(["NOTICE", "Important notice"]));
    mockRelay.send(JSON.stringify(["OTHER", "other message"]));

    // Verify only NOTICE messages are in the state
    expect(relay.notices$.value).toEqual(["Important notice"]);
  });
});

describe("challenge$", () => {
  it("should set challenge$ when AUTH message received", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));

    // Send AUTH message with challenge string
    mockRelay.send(JSON.stringify(["AUTH", "challenge-string-123"]));

    // Verify challenge$ was set
    expect(relay.challenge$.value).toBe("challenge-string-123");
  });

  it("should ignore non-AUTH messages", async () => {
    subscribeSpyTo(relay.req({ kinds: [1] }));

    mockRelay.send(JSON.stringify(["NOTICE", "Not a challenge"]));
    mockRelay.send(JSON.stringify(["OTHER", "other message"]));

    // Verify challenge$ remains null
    expect(relay.challenge$.value).toBe(null);
  });
});
