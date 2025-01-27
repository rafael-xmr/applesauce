import { describe, it, expect } from "vitest";
import { EventTemplate, kinds } from "nostr-tools";
import { unixNow } from "applesauce-core/helpers";

import { EventFactory } from "../../event-factory.js";
import { setListDescription, setListTitle } from "./list.js";

const factory = new EventFactory();

describe("setListTitle", () => {
  it("should override existing title tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [["title", "inspirational quotes"]],
      created_at: unixNow(),
    };

    expect(await factory.modifyList(list, undefined, setListTitle("quotes"))).toEqual(
      expect.objectContaining({ tags: [["title", "quotes"]] }),
    );
  });

  it("should add title tag", async () => {
    const list: EventTemplate = {
      kind: kinds.Bookmarksets,
      content: "",
      tags: [],
      created_at: unixNow(),
    };

    expect(await factory.modifyList(list, undefined, setListTitle("quotes"))).toEqual(
      expect.objectContaining({ tags: [["title", "quotes"]] }),
    );
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

    expect(await factory.modifyList(list, undefined, setListDescription("all my favorite quotes"))).toEqual(
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

    expect(await factory.modifyList(list, undefined, setListDescription("all my favorite quotes"))).toEqual(
      expect.objectContaining({
        tags: [
          ["title", "inspirational quotes"],
          ["description", "all my favorite quotes"],
        ],
      }),
    );
  });
});
