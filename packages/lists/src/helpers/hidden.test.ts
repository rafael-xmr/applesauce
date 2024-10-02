import { unixNow } from "applesauce-core/helpers";
import { finalizeEvent, generateSecretKey, getPublicKey, kinds, nip44, NostrEvent } from "nostr-tools";
import { getHiddenTags, unlockHiddenTags } from "./hidden.js";

describe("Private Lists", () => {
  const key = generateSecretKey();
  const pubkey = getPublicKey(key);

  describe("unlockHiddenTags", () => {
    let list: NostrEvent;

    beforeEach(() => {
      list = finalizeEvent(
        {
          kind: kinds.Mutelist,
          created_at: unixNow(),
          content: nip44.encrypt(
            JSON.stringify([["p", "npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr"]]),
            nip44.getConversationKey(key, pubkey),
          ),
          tags: [],
        },
        key,
      );
    });

    it("should unlock hidden tags", async () => {
      await unlockHiddenTags(list, (c) => nip44.decrypt(c, nip44.getConversationKey(key, pubkey)));

      expect(getHiddenTags(list)).toEqual(
        expect.arrayContaining([["p", "npub1ye5ptcxfyyxl5vjvdjar2ua3f0hynkjzpx552mu5snj3qmx5pzjscpknpr"]]),
      );
    });
  });
});
