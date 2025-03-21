import { beforeEach, describe, expect, it } from "vitest";
import { repairContentNostrLinks, setContent, setEncryptedContent } from "../content.js";
import { FakeUser } from "../../../__tests__/fake-user.js";
import { HiddenContentSymbol } from "applesauce-core/helpers";

let user: FakeUser;

beforeEach(() => {
  user = new FakeUser();
});

describe("repairContentNostrLinks", () => {
  it("should repair @npub mentions", async () => {
    expect(
      await repairContentNostrLinks()(
        {
          kind: 1,
          content: "GM @npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
          tags: [],
          created_at: 0,
        },
        {},
      ),
    ).toEqual(
      expect.objectContaining({
        content: "GM nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
      }),
    );
  });

  it("should repair bare npub mentions", async () => {
    expect(
      await repairContentNostrLinks()(
        {
          kind: 1,
          content: "GM npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
          tags: [],
          created_at: 0,
        },
        {},
      ),
    ).toEqual(
      expect.objectContaining({
        content: "GM nostr:npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
      }),
    );
  });

  it("should repair bare naddr mention", async () => {
    expect(
      await repairContentNostrLinks()(
        {
          kind: 1,
          content:
            "check this out naddr1qvzqqqrkvupzqefcjf0tldnp7svd337swjlw96906au8q8wcjpcv9k5nd4t3u4wrqyv8wumn8ghj7un9d3shjtnxda6kuarpd9hzuend9uqzgdpcxf3rvvnrvcknser9vcknge33xskkyvmzvykkgvmrxvcnqvnpxpsnwcsdvl9jq",
          tags: [],
          created_at: 0,
        },
        {},
      ),
    ).toEqual(
      expect.objectContaining({
        content:
          "check this out nostr:naddr1qvzqqqrkvupzqefcjf0tldnp7svd337swjlw96906au8q8wcjpcv9k5nd4t3u4wrqyv8wumn8ghj7un9d3shjtnxda6kuarpd9hzuend9uqzgdpcxf3rvvnrvcknser9vcknge33xskkyvmzvykkgvmrxvcnqvnpxpsnwcsdvl9jq",
      }),
    );
  });
});

describe("setContent", () => {
  it("should remove HiddenContentSymbol", async () => {
    const operation = setContent("secret message");
    const draft = await operation({ kind: 1, content: "", tags: [], created_at: 0 }, { signer: user });
    expect(Reflect.has(draft, HiddenContentSymbol)).toBe(false);
  });

  it("should set content", async () => {
    const operation = setContent("message");
    const draft = await operation({ kind: 1, content: "", tags: [], created_at: 0 }, { signer: user });
    expect(draft.content).toBe("message");
  });
});

describe("setEncryptedContent", () => {
  it("should set HiddenContentSymbol with plaintext content for nip04", async () => {
    const operation = setEncryptedContent(user.pubkey, "secret message", "nip04");
    const draft = await operation({ kind: 1, content: "", tags: [], created_at: 0 }, { signer: user });

    expect(Reflect.get(draft, HiddenContentSymbol)).toBe("secret message");
  });

  it("should set HiddenContentSymbol with plaintext content for nip44", async () => {
    const operation = setEncryptedContent(user.pubkey, "secret message", "nip44");
    const draft = await operation({ kind: 1, content: "", tags: [], created_at: 0 }, { signer: user });

    expect(Reflect.get(draft, HiddenContentSymbol)).toBe("secret message");
  });

  it("should throw error if no signer provided", async () => {
    const operation = setEncryptedContent(user.pubkey, "secret message", "nip04");
    await expect(operation({ kind: 1, content: "", tags: [], created_at: 0 }, { signer: undefined })).rejects.toThrow(
      "Signer required for encrypted content",
    );
  });

  it("should throw error if signer does not support encryption method", async () => {
    const operation = setEncryptedContent(user.pubkey, "secret message", "nip44");

    // @ts-expect-error
    delete user.nip44;

    await expect(operation({ kind: 1, content: "", tags: [], created_at: 0 }, { signer: user })).rejects.toThrow(
      "Signer does not support nip44 encryption",
    );
  });
});
