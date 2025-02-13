import { describe, expect, it } from "vitest";
import { interpretThreadTags } from "../threading.js";

describe("threading helpers", () => {
  describe("interpretThreadTags", () => {
    it("should handle legacy tags", () => {
      expect(
        interpretThreadTags([
          ["e", "root-id"],
          ["e", "reply-id"],
        ]),
      ).toEqual({ root: { a: undefined, e: ["e", "root-id"] }, reply: { a: undefined, e: ["e", "reply-id"] } });
    });

    it("should handle nip-10 tags", () => {
      expect(
        interpretThreadTags([
          ["e", "root-id", "relay", "root"],
          ["e", "reply-id", "relay", "reply"],
        ]),
      ).toEqual({
        root: { a: undefined, e: ["e", "root-id", "relay", "root"] },
        reply: { a: undefined, e: ["e", "reply-id", "relay", "reply"] },
      });
    });

    it("should ignore mention nip-10 tags", () => {
      expect(
        interpretThreadTags([
          ["e", "root-id", "relay", "root"],
          ["e", "mention-id", "relay", "mention"],
          ["e", "reply-id", "relay", "reply"],
        ]),
      ).toEqual({
        root: { a: undefined, e: ["e", "root-id", "relay", "root"] },
        reply: { a: undefined, e: ["e", "reply-id", "relay", "reply"] },
      });
    });

    it("should handle single nip-10 tags", () => {
      expect(interpretThreadTags([["e", "root-id", "relay", "root"]])).toEqual({
        root: { a: undefined, e: ["e", "root-id", "relay", "root"] },
        reply: { a: undefined, e: ["e", "root-id", "relay", "root"] },
      });

      expect(interpretThreadTags([["e", "reply-id", "relay", "reply"]])).toEqual({
        root: { a: undefined, e: ["e", "reply-id", "relay", "reply"] },
        reply: { a: undefined, e: ["e", "reply-id", "relay", "reply"] },
      });
    });
  });
});
