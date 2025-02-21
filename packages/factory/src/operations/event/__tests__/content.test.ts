import { describe, expect, it } from "vitest";
import { repairContentNostrLinks } from "../content.js";

describe("content operations", () => {
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
});
