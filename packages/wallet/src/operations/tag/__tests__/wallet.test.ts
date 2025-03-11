import { describe, it, expect } from "vitest";
import { setMintTags } from "../wallet.js";

describe("setMintTags", () => {
  it("should replace existing mint tags", () => {
    expect(setMintTags(["https://mint.com"])([["mint", "https://other.mint.com"]], {})).toEqual(
      expect.arrayContaining([["mint", "https://mint.com"]]),
    );
  });

  it("should ignore other tags", () => {
    expect(
      setMintTags(["https://mint.com"])(
        [
          ["mint", "https://other.mint.com"],
          ["privkey", "00000000"],
        ],
        {},
      ),
    ).toEqual(
      expect.arrayContaining([
        ["mint", "https://mint.com"],
        ["privkey", "00000000"],
      ]),
    );
  });
});
