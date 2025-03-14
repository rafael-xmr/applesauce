import { describe, it, expect, beforeEach, vitest, Mock } from "vitest";
import { EventStore } from "applesauce-core";
import { EventFactory } from "applesauce-factory";
import { ActionHub } from "applesauce-actions";

import { FakeUser } from "../../__tests__/fake-user.js";
import { CreateWallet } from "../wallet.js";
import { WALLET_BACKUP_KIND } from "../../helpers/wallet.js";
import { unlockHiddenTags } from "applesauce-core/helpers";
import { lastValueFrom } from "rxjs";

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
    expect(publish).toHaveBeenCalledWith(expect.objectContaining({ kind: WALLET_BACKUP_KIND }));
  });

  it("should publish a wallet event with mints", async () => {
    const event = await lastValueFrom(hub.exec(CreateWallet, ["https://mint.money.com"]));
    const hiddenTags = await unlockHiddenTags(event, user);

    // the second call should be the wallet event
    expect(hiddenTags).toEqual(expect.arrayContaining([["mint", "https://mint.money.com"]]));
  });
});
