import { beforeEach, describe, expect, it, vitest } from "vitest";
import { EventStore } from "applesauce-core";
import { EventFactory } from "applesauce-factory";
import { kinds } from "nostr-tools";

import { FakeUser } from "../../__tests__/fake-user.js";
import { ActionHub } from "../../action-hub.js";
import { CreateBookmarkList } from "../bookmarks.js";

const user = new FakeUser();

let events: EventStore;
let factory: EventFactory;
let publish: () => Promise<void>;
let hub: ActionHub;
beforeEach(() => {
  events = new EventStore();
  factory = new EventFactory({ signer: user });
  publish = vitest.fn().mockResolvedValue(undefined);
  hub = new ActionHub(events, factory, publish);
});

describe("CreateBookmarkList", () => {
  it("should publish a kind 10003 bookmark list", async () => {
    await hub.run(CreateBookmarkList);

    expect(publish).toBeCalledWith(expect.objectContaining({ kind: kinds.BookmarkList }));
  });
});
