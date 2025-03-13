import { ProfileContent } from "applesauce-core/helpers";
import { Action } from "../action-hub.js";
import { kinds } from "nostr-tools";
import { setProfileContent, updateProfileContent } from "applesauce-factory/operations/event";

/** An action that creates a new kind 0 profile event for a user */
export function CreateProfile(content: ProfileContent): Action {
  return async ({ events, factory, self, publish }) => {
    const metadata = events.getReplaceable(kinds.Metadata, self);
    if (metadata) throw new Error("Profile already exists");

    const draft = await factory.process({ kind: kinds.Metadata }, setProfileContent(content));
    await publish("Create profile", await factory.sign(draft));
  };
}

/** An action that updates a kind 0 profile evnet for a user */
export function UpdateProfile(content: Partial<ProfileContent>): Action {
  return async ({ events, factory, self, publish }) => {
    const metadata = events.getReplaceable(kinds.Metadata, self);
    if (!metadata) throw new Error("Profile does not exists");

    const draft = await factory.modify(metadata, updateProfileContent(content));
    await publish("Update profile", await factory.sign(draft));
  };
}
