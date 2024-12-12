import { describe, expect, it } from "vitest";
import { NostrEvent } from "nostr-tools";
import { COMMENT_KIND } from "applesauce-core/helpers";

import { EventFactory } from "../event-factory.js";
import { CommentBlueprint } from "./comment.js";

describe("CommentBlueprint", () => {
  const factory = new EventFactory();

  it("should handle replying to an article", async () => {
    const article: NostrEvent = {
      content: "# The case against edits...",
      created_at: 1730991377,
      id: "caa65d8b3b11d887da7188f3fe75c33d7be80d3df8c46f241a275b9075888674",
      kind: 30023,
      pubkey: "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
      sig: "eb30514d222b3ed83a2b3addd8242abe039d88f43330f1f06a1efba8840ea46ce687f60d582237f28bb88845a65de421d25bdda7eb2cb3d3c125b986722c230b",
      tags: [
        ["d", "ad84e3b3"],
        ["title", "The case against edits"],
        ["published_at", "1730973840"],
        ["t", "nostr"],
      ],
    };

    expect(await factory.create(CommentBlueprint, article, "why?")).toEqual(
      expect.objectContaining({
        kind: COMMENT_KIND,
        content: "why?",
        tags: [
          ["A", "30023:3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d:ad84e3b3"],
          [
            "E",
            "caa65d8b3b11d887da7188f3fe75c33d7be80d3df8c46f241a275b9075888674",
            "",
            "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
          ],
          ["K", "30023"],
          ["a", "30023:3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d:ad84e3b3"],
          [
            "e",
            "caa65d8b3b11d887da7188f3fe75c33d7be80d3df8c46f241a275b9075888674",
            "",
            "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d",
          ],
          ["k", "30023"],
          ["p", "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d"],
        ],
      }),
    );
  });
});
