import { describe, test, it, expect } from "vitest";

import { EventPointer } from "nostr-tools/nip19";
import { ensureAddressPointerTag, ensureMarkedEventPointerTag, ensureProfilePointerTag } from "./common-tags.js";
import { Nip10TagMarker } from "./pointer.js";

describe("common tags helpers", () => {
  describe("ensureEventPointerTag", () => {
    test.each<[string[][], EventPointer, Nip10TagMarker | undefined, string[][]]>([
      // merge simple into simple
      [[["e", "event-id"]], { id: "event-id" }, undefined, [["e", "event-id"]]],
      // merge hint into simple
      [
        [["e", "event-id"]],
        { id: "event-id", relays: ["wss://relay.example.com"] },
        undefined,
        [["e", "event-id", "wss://relay.example.com"]],
      ],
      // merge author into simple
      [[["e", "event-id"]], { id: "event-id", author: "pubkey" }, undefined, [["e", "event-id", "", "", "pubkey"]]],
      // merge author + hint into simple
      [
        [["e", "event-id"]],
        { id: "event-id", author: "pubkey", relays: ["wss://relay.example.com"] },
        undefined,
        [["e", "event-id", "wss://relay.example.com", "", "pubkey"]],
      ],
    ])("should correctly merge the tag", (input, pointer, marker, output) => {
      expect(ensureMarkedEventPointerTag(input, pointer, marker)).toEqual(output);
    });

    test.each<[string[][], EventPointer, Nip10TagMarker | undefined, string[][]]>([
      // keep hint
      [
        [["e", "event-id", "wss://relay.example.com"]],
        { id: "event-id" },
        undefined,
        [["e", "event-id", "wss://relay.example.com"]],
      ],
      // keep pubkey
      [[["e", "event-id", "", "", "pubkey"]], { id: "event-id" }, undefined, [["e", "event-id", "", "", "pubkey"]]],
      // keep pubkey and add hint
      [
        [["e", "event-id", "", "", "pubkey"]],
        { id: "event-id", relays: ["wss://relay.example.com"] },
        undefined,
        [["e", "event-id", "wss://relay.example.com", "", "pubkey"]],
      ],
    ])("should keep fields", (input, pointer, marker, output) => {
      expect(ensureMarkedEventPointerTag(input, pointer, marker)).toEqual(output);
    });

    it("should append a tag when markers are different", () => {
      expect(ensureMarkedEventPointerTag([["e", "event-id", "", "root"]], { id: "event-id" })).toEqual([
        ["e", "event-id", "", "root"],
        ["e", "event-id"],
      ]);
    });

    it("should only merge tag when markers are equal", () => {
      // should not merge
      expect(ensureMarkedEventPointerTag([["e", "event-id", "", "root"]], { id: "event-id" })).toHaveLength(2);

      // should merge since both root
      expect(
        ensureMarkedEventPointerTag([["e", "event-id", "", "root"]], { id: "event-id", author: "pubkey" }, "root"),
      ).toHaveLength(1);
    });
  });

  describe("ensureProfilePointerTag", () => {
    it("should merge tags", () => {
      expect(ensureProfilePointerTag([["p", "pubkey"]], { pubkey: "pubkey" })).toEqual([["p", "pubkey"]]);
    });

    it("should merge hint", () => {
      expect(
        ensureProfilePointerTag([["p", "pubkey"]], { pubkey: "pubkey", relays: ["wss://relay.example.com"] }),
      ).toEqual([["p", "pubkey", "wss://relay.example.com"]]);
    });

    it("should NOT override hint", () => {
      expect(ensureProfilePointerTag([["p", "pubkey", "wss://relay.example.com"]], { pubkey: "pubkey" })).toEqual([
        ["p", "pubkey", "wss://relay.example.com"],
      ]);
    });

    it("should NOT merge different tags", () => {
      expect(ensureProfilePointerTag([["p", "pubkey", "wss://relay.example.com"]], { pubkey: "pubkey2" })).toEqual([
        ["p", "pubkey", "wss://relay.example.com"],
        ["p", "pubkey2"],
      ]);
    });
  });

  describe("ensureAddressPointerTag", () => {
    it("should merge tags", () => {
      expect(
        ensureAddressPointerTag([["a", "10000:pubkey:list"]], { kind: 10000, pubkey: "pubkey", identifier: "list" }),
      ).toEqual([["a", "10000:pubkey:list"]]);
    });

    it("should merge hint", () => {
      expect(
        ensureAddressPointerTag([["a", "10000:pubkey:list"]], {
          kind: 10000,
          pubkey: "pubkey",
          identifier: "list",
          relays: ["wss://relay.example.com"],
        }),
      ).toEqual([["a", "10000:pubkey:list", "wss://relay.example.com"]]);
    });

    it("should NOT override hint", () => {
      expect(
        ensureAddressPointerTag([["a", "10000:pubkey:list", "wss://relay.example.com"]], {
          kind: 10000,
          pubkey: "pubkey",
          identifier: "list",
        }),
      ).toEqual([["a", "10000:pubkey:list", "wss://relay.example.com"]]);
    });

    it("should NOT merge different tags", () => {
      expect(
        ensureAddressPointerTag([["a", "10000:pubkey:list", "wss://relay.example.com"]], {
          kind: 10000,
          pubkey: "pubkey",
          identifier: "list2",
        }),
      ).toEqual([
        ["a", "10000:pubkey:list", "wss://relay.example.com"],
        ["a", "10000:pubkey:list2"],
      ]);
    });
  });
});
