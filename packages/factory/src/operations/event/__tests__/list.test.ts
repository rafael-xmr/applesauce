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

    expect(await setListTitle("quotes")(list, {})).toEqual(expect.objectContaining({ tags: [["title", "quotes"]] }));
  });

  it("should add title tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [],
      created_at: unixNow(),
    };

    expect(await setListTitle("quotes")(list, {})).toEqual(expect.objectContaining({ tags: [["title", "quotes"]] }));
  });

  it("should remove title tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [["title", "inspirational quotes"]],
      created_at: unixNow(),
    };

    expect(await setListTitle(null)(list, {})).toEqual(expect.objectContaining({ tags: [] }));
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

    expect(await setListDescription("all my favorite quotes")(list, {})).toEqual(
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

    expect(await setListDescription("all my favorite quotes")(list, {})).toEqual(
      expect.objectContaining({
        tags: [
          ["title", "inspirational quotes"],
          ["description", "all my favorite quotes"],
        ],
      }),
    );
  });

  it("should remove description tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [
        ["title", "inspirational quotes"],
        ["description", "all my favorite quotes"],
      ],
      created_at: unixNow(),
    };

    expect(await setListDescription(null)(list, {})).toEqual(
      expect.objectContaining({ tags: [["title", "inspirational quotes"]] }),
    );
  });
});
