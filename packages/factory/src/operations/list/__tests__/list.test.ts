import { describe, it, expect } from "vitest";
import { EventTemplate, kinds } from "nostr-tools";
import { unixNow } from "applesauce-core/helpers";

import { setListDescription, setListTitle } from "../list.js";

describe("setListTitle", () => {
  it("should override existing title tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [["title", "inspirational quotes"]],
      created_at: unixNow(),
    };

    expect(setListTitle("quotes")(list, {})).toEqual(expect.objectContaining({ tags: [["title", "quotes"]] }));
  });

  it("should add title tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [],
      created_at: unixNow(),
    };

    expect(setListTitle("quotes")(list, {})).toEqual(expect.objectContaining({ tags: [["title", "quotes"]] }));
  });
});

describe("setListDescription", () => {
  it("should override existing description tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [
        ["title", "inspirational quotes"],
        ["description", "nothing yet"],
      ],
      created_at: unixNow(),
    };

    expect(setListDescription("all my favorite quotes")(list, {})).toEqual(
      expect.objectContaining({
        tags: [
          ["title", "inspirational quotes"],
          ["description", "all my favorite quotes"],
        ],
      }),
    );
  });

  it("should add description tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [["title", "inspirational quotes"]],
      created_at: unixNow(),
    };

    expect(setListDescription("all my favorite quotes")(list, {})).toEqual(
      expect.objectContaining({
        tags: [
          ["title", "inspirational quotes"],
          ["description", "all my favorite quotes"],
        ],
      }),
    );
  });
});
