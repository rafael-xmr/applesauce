import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventFactory } from "../event-factory.js";
import { finalizeEvent, kinds, nip04 } from "nostr-tools";
import { FakeUser } from "./fake-user.js";
import { getHiddenTags, HiddenContentSymbol, unlockHiddenTags } from "applesauce-core/helpers";
import { addEventTag, removeEventTag } from "../operations/tag/common.js";
import { setListTitle } from "../operations/event/list.js";
import { setEncryptedContent } from "../operations/event/content.js";
import { includeAltTag } from "../operations/event/tags.js";

let factory = new EventFactory();
let user = new FakeUser();

beforeEach(() => {
  factory = new EventFactory();
  user = new FakeUser();

  // create signer for factory
  factory.context.signer = {
    getPublicKey: () => user.pubkey,
    signEvent: (draft) => finalizeEvent(draft, user.key),
    nip04: {
      encrypt: (pubkey, text) => nip04.encrypt(user.key, pubkey, text),
      decrypt: (pubkey, data) => nip04.decrypt(user.key, pubkey, data),
    },
  };
});

describe("runProcess", () => {
  it('should add "d" tags to parameterized replaceable events', async () => {
    expect(await EventFactory.runProcess({ kind: kinds.Bookmarksets }, {}, setListTitle("testing"))).toEqual({
      content: "",
      tags: [
        ["d", expect.any(String)],
        ["title", "testing"],
      ],
      created_at: expect.any(Number),
      kind: kinds.Bookmarksets,
    });
  });

  it("should preserve plaintext hidden content", async () => {
    const user = new FakeUser();
    const draft = await EventFactory.runProcess(
      { kind: kinds.PrivateDirectMessage },
      { signer: user },
      setEncryptedContent(user.pubkey, "hello world", "nip04"),
      includeAltTag("direct message"),
    );

    expect(Reflect.get(draft, HiddenContentSymbol)).toEqual("hello world");
  });
});

describe("modify", () => {
  it("should add created_at", async () => {
    expect(await factory.modify({ kind: kinds.BookmarkList })).toEqual({
      kind: kinds.BookmarkList,
      created_at: expect.any(Number),
      content: "",
      tags: [],
    });
  });

  it("should override created_at", async () => {
    expect(await factory.modify({ kind: kinds.BookmarkList, created_at: 0 })).not.toEqual({
      kind: kinds.BookmarkList,
      created_at: 0,
    });
  });
});

describe("modify", () => {
  it("should apply operations to event", async () => {
    expect(await factory.modify(user.list([["e", "event-id"]]), setListTitle("read later"))).toEqual(
      expect.objectContaining({ tags: expect.arrayContaining([["title", "read later"]]) }),
    );
  });
});

describe("modifyTags", () => {
  it("should apply tag operations to public tags by default", async () => {
    expect(await factory.modifyTags(user.list([["e", "event-id"]]), removeEventTag("event-id"))).not.toEqual(
      expect.objectContaining({ tags: expect.arrayContaining(["e", "event-id"]) }),
    );
  });

  it("should apply public operations", async () => {
    expect(
      await factory.modifyTags(user.list([["e", "event-id"]]), { public: removeEventTag("event-id") }),
    ).not.toEqual(expect.objectContaining({ tags: expect.arrayContaining(["e", "event-id"]) }));
  });

  it("should throw error when modify hidden tags without signer", async () => {
    factory = new EventFactory();

    await expect(async () => {
      await factory.modifyTags(user.list(), { hidden: removeEventTag("event-id") });
    }).rejects.toThrowError("Missing signer");
  });

  it("should apply hidden operations", async () => {
    const draft = await factory.modifyTags(user.list(), { hidden: addEventTag("event-id") });

    // convert draft to full event
    const signed = await factory.context.signer!.signEvent(draft);

    // unlock hidden tags
    await unlockHiddenTags(signed, factory.context.signer!);

    expect(getHiddenTags(draft)).toEqual(expect.arrayContaining([["e", "event-id"]]));
  });

  it("should unlock hidden tags before modifying", async () => {
    const signer = factory.context.signer!;
    const encryptedList = user.list([], {
      content: await signer.nip04!.encrypt(await signer.getPublicKey(), JSON.stringify([["e", "event-id"]])),
    });

    // modify the hidden tags
    const draft = await factory.modifyTags(encryptedList, { hidden: addEventTag("second-event-id") });

    // convert draft to full event
    const signed = await factory.context.signer!.signEvent(draft);

    await unlockHiddenTags(signed, factory.context.signer!);
    expect(getHiddenTags(draft)).toEqual(
      expect.arrayContaining([
        ["e", "event-id"],
        ["e", "second-event-id"],
      ]),
    );
  });

  it("should not unlock hidden tags if already unlocked before modifying", async () => {
    const signer = factory.context.signer!;
    const encryptedList = user.list([], {
      content: await signer.nip04!.encrypt(await signer.getPublicKey(), JSON.stringify([["e", "event-id"]])),
    });

    await unlockHiddenTags(encryptedList, signer);
    vi.spyOn(signer.nip04!, "decrypt");

    // modify the hidden tags
    await factory.modifyTags(encryptedList, { hidden: addEventTag("second-event-id") });

    expect(signer.nip04!.decrypt).not.toHaveBeenCalled();
  });
});

describe("sign", () => {
  it("should throw if no signer is present", async () => {
    const factory = new EventFactory();

    await expect(async () => factory.sign(await factory.note("testing"))).rejects.toThrow();
  });

  it("should preserve plaintext hidden content", async () => {
    const user = new FakeUser();
    const factory = new EventFactory({ signer: user });
    const draft = await factory.build({ kind: 4 }, setEncryptedContent(user.pubkey, "testing", "nip04"));
    const signed = await factory.sign(draft);

    expect(Reflect.get(signed, HiddenContentSymbol)).toBe("testing");
  });
});
