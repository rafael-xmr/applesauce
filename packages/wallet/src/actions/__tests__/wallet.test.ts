import { describe, it, expect, beforeEach, vitest, Mock } from "vitest";
import { EventStore } from "applesauce-core";
import { EventFactory } from "applesauce-factory";
import { ActionHub } from "applesauce-actions";

import { FakeUser } from "../../__tests__/fake-user.js";
import { CreateWallet } from "../wallet.js";
import { WALLET_BACKUP_KIND } from "../../helpers/wallet.js";
import { NostrEvent } from "nostr-tools";
import { unlockHiddenTags } from "applesauce-core/helpers";

const user = new FakeUser();

let events: EventStore;
let factory: EventFactory;
let publish: Mock<() => Promise<void>>;
let hub: ActionHub;
beforeEach(() => {
  events = new EventStore();
  factory = new EventFactory({ signer: user });
  publish = vitest.fn().mockResolvedValue(undefined);
  hub = new ActionHub(events, factory, publish);
});

describe("CreateWallet", () => {
  it("should publish a wallet backup event", async () => {
    await hub.run(CreateWallet, ["https://mint.money.com"]);
    expect(publish).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ kind: WALLET_BACKUP_KIND }));
  });

  it("should publish a wallet event with mints", async () => {
    await hub.run(CreateWallet, ["https://mint.money.com"]);

    // @ts-expect-error
    const walletEvent = publish.mock.calls[1][1] as NostrEvent;

    const hiddenTags = await unlockHiddenTags(walletEvent, user);

    // the second call should be the wallet event
    expect(hiddenTags).toEqual(expect.arrayContaining([["mint", "https://mint.money.com"]]));
  });
});
