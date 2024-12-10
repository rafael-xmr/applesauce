import { describe, test, expect } from "vitest";
import { EventPointer } from "nostr-tools/nip19";

import { createQTagFromEventPointer } from "./quote.js";

describe("quote helpers", () => {
  describe("createQTagFromEventPointer", () => {
    test.each<[EventPointer, string[]]>([
      // simple pointer
      [
        {
          id: "event-id",
          kind: 1,
        },
        ["q", "event-id"],
      ],
      // pointer with pubkey
      [
        {
          id: "event-id",
          kind: 1,
          author: "pubkey",
        },
        ["q", "event-id", "", "pubkey"],
      ],
      // pointer with hint
      [
        {
          id: "event-id",
          kind: 1,
          relays: ["wss://example.com"],
        },
        ["q", "event-id", "wss://example.com"],
      ],
      // pointer with pubkey + hint
      [
        {
          id: "event-id",
          kind: 1,
          author: "pubkey",
          relays: ["wss://example.com"],
        },
        ["q", "event-id", "wss://example.com", "pubkey"],
      ],
    ])("Creates correct tag for pointer", (pointer, tag) => {
      expect(createQTagFromEventPointer(pointer)).toEqual(tag);
    });
  });
});
