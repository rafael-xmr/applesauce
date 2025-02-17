import { describe, expect, it } from "vitest";
import { getEmojiTag } from "../emoji.js";
import { FakeUser } from "../../__tests__/fixtures.js";

const user = new FakeUser();

describe("getEmojiTag", () => {
  it("Should find emoji tag", () => {
    expect(
      getEmojiTag(
        user.note("hello :custom:", { tags: [["emoji", "custom", "https://cdn.example.com/reaction1.png"]] }),
        "custom",
      ),
    ).toEqual(["emoji", "custom", "https://cdn.example.com/reaction1.png"]);
  });

  it("Should custom leading and trailing :", () => {
    expect(
      getEmojiTag(
        user.note("hello :custom:", { tags: [["emoji", "custom", "https://cdn.example.com/reaction1.png"]] }),
        ":custom:",
      ),
    ).toEqual(["emoji", "custom", "https://cdn.example.com/reaction1.png"]);
  });

  it("Should convert to lowercase", () => {
    expect(
      getEmojiTag(
        user.note("hello :custom:", { tags: [["emoji", "custom", "https://cdn.example.com/reaction1.png"]] }),
        "CustoM",
      ),
    ).toEqual(["emoji", "custom", "https://cdn.example.com/reaction1.png"]);
  });
});
