import { describe, test, expect, it } from "vitest";

import { EventPointer } from "nostr-tools/nip19";
import {
  createATagFromAddressPointer,
  createETagWithMarkerFromEventPointer,
  createPTagFromProfilePointer,
} from "./pointer.js";

describe(`pointer helpers`, () => {
  describe("createATagFromAddressPointer", () => {
    it("should create simple tag", () => {
      expect(
        createATagFromAddressPointer({
          pubkey: "pubkey",
          kind: 10000,
          identifier: "list",
        }),
      ).toEqual(["a", "10000:pubkey:list"]);
    });

    it("should include relay hint", () => {
      expect(
        createATagFromAddressPointer({
          pubkey: "pubkey",
          kind: 10000,
          identifier: "list",
          relays: ["wss://example.com"],
        }),
      ).toEqual(["a", "10000:pubkey:list", "wss://example.com"]);
    });
  });

  describe("createETagFromEventPointer", () => {
    test.each<[EventPointer, string | undefined, string[]]>([
      // simple pointer
      [
        {
          id: "event-id",
          kind: 1,
        },
        undefined,
        ["e", "event-id"],
      ],
      // pointer with pubkey
      [
        {
          id: "event-id",
          kind: 1,
          author: "pubkey",
        },
        undefined,
        ["e", "event-id", "", "", "pubkey"],
      ],
      // marker pointer
      [
        {
          id: "event-id",
          kind: 1,
        },
        "root",
        ["e", "event-id", "", "root"],
      ],
      // marker pointer with hint
      [
        {
          id: "event-id",
          kind: 1,
          relays: ["wss://example.com"],
        },
        "root",
        ["e", "event-id", "wss://example.com", "root"],
      ],
      // marker pointer with pubkey
      [
        {
          id: "event-id",
          kind: 1,
          author: "pubkey",
        },
        "root",
        ["e", "event-id", "", "root", "pubkey"],
      ],
      // marker pointer with pubkey and hint
      [
        {
          id: "event-id",
          kind: 1,
          author: "pubkey",
          relays: ["wss://example.com"],
        },
        "root",
        ["e", "event-id", "wss://example.com", "root", "pubkey"],
      ],
    ])("Creates correct tag for pointer", (pointer, marker, tag) => {
      expect(createETagWithMarkerFromEventPointer(pointer, marker as "root" | "reply" | "mention" | undefined)).toEqual(
        tag,
      );
    });
  });

  describe("createPTagFromProfilePointer", () => {
    it("should create simple p tag", () => {
      expect(createPTagFromProfilePointer({ pubkey: "pubkey" })).toEqual(["p", "pubkey"]);
    });

    it("should include relay hint", () => {
      expect(createPTagFromProfilePointer({ pubkey: "pubkey", relays: ["wss://replay.example.com"] })).toEqual([
        "p",
        "pubkey",
        "wss://replay.example.com",
      ]);
    });
  });
});
