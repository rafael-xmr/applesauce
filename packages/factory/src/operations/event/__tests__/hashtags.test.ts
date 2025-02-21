import { describe, expect, it } from "vitest";
import { includeContentHashtags, includeHashtags } from "../hashtags.js";
import { unixNow } from "applesauce-core/helpers";

describe("hashtags helpers", () => {
  describe("includeContentHashtags", () => {
    it("should include all content hashtags", () => {
      expect(
        includeContentHashtags()(
          { content: "hello world #growNostr #nostr", created_at: unixNow(), tags: [], kind: 1 },
          {},
        ),
      ).toEqual(
        expect.objectContaining({
          tags: [
            ["t", "grownostr"],
            ["t", "nostr"],
          ],
        }),
      );
    });
  });

  describe("includeHashtags", () => {
    it("should include all hashtags", () => {
      expect(
        includeHashtags(["nostr", "growNostr"])(
          { content: "hello world", created_at: unixNow(), tags: [], kind: 1 },
          {},
        ),
      ).toEqual(
        expect.objectContaining({
          tags: [
            ["t", "nostr"],
            ["t", "grownostr"],
          ],
        }),
      );
    });
  });
});
