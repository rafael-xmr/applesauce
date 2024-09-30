import { NostrEvent } from "nostr-tools";

export const ProfileContentSymbol = Symbol.for("profile-content");
declare module "nostr-tools" {
  export interface Event {
    [ProfileContentSymbol]?: ProfileContent | Error;
  }
}

export type ProfileContent = {
  name?: string;
  display_name?: string;
  displayName?: string;
  about?: string;
  /** @deprecated */
  image?: string;
  picture?: string;
  banner?: string;
  website?: string;
  lud16?: string;
  lud06?: string;
  nip05?: string;
};

/** Returns the parsed profile content for a kind 0 event */
export function getProfileContent(event: NostrEvent): ProfileContent;
export function getProfileContent(event: NostrEvent, quite: false): ProfileContent;
export function getProfileContent(event: NostrEvent, quite: true): ProfileContent | Error;
export function getProfileContent(event: NostrEvent, quite = false) {
  let cached = event[ProfileContentSymbol];

  if (!cached) {
    try {
      const profile = JSON.parse(event.content) as ProfileContent;

      // ensure nip05 is a string
      if (profile.nip05 && typeof profile.nip05 !== "string") profile.nip05 = String(profile.nip05);

      cached = event[ProfileContentSymbol] = profile;
    } catch (e) {
      if (e instanceof Error) cached = event[ProfileContentSymbol] = e;
    }
  }

  if (cached === undefined) {
    throw new Error("Failed to parse profile");
  } else if (cached instanceof Error) {
    if (!quite) throw cached;
    else return cached;
  } else return cached;
}
