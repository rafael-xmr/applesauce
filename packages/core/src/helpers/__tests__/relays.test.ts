import { describe, expect, it } from "vitest";
import { isSafeRelayURL } from "../relays.js";

describe("isSafeRelayURL", () => {
  it("should correctly filter URLs", () => {
    // safe URLs
    expect(isSafeRelayURL("wss://relay.damus.io/")).toBe(true);
    expect(isSafeRelayURL("wss://nostrue.com")).toBe(true);
    expect(isSafeRelayURL("ws://192.168.0.194:8080")).toBe(true);
    expect(isSafeRelayURL("ws://localhost:4869/ws")).toBe(true);
    expect(isSafeRelayURL("ws://localhost/testing")).toBe(true);
    expect(isSafeRelayURL("ws://437fqnfqtcaquzvs5sd43ugznw7dsoatvtskoowgnpn6q5vqkljcrsyd.onion")).toBe(true);
    expect(isSafeRelayURL("ws://hypr1fk4trjnhjf62r6hhkpettmvxhxx2uvkkg4u4ea44va2fvxvfkl4s82m6dy.hyper")).toBe(true);

    // bad URLs
    expect(isSafeRelayURL("")).toBe(false);
    expect(isSafeRelayURL("bad")).toBe(false);
    expect(isSafeRelayURL("bad wss://nostr.wine")).toBe(false);
    expect(isSafeRelayURL("http://nostr.wine")).toBe(false);
    expect(isSafeRelayURL("http://cache-relay.com")).toBe(false);
    expect(isSafeRelayURL("wss://nostr.wine,wss://relayable.com")).toBe(false);
  });
});
