import { NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";

export const ProfileContentSymbol = Symbol.for("profile-content");

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
export function getProfileContent(event: NostrEvent) {
  return getOrComputeCachedValue(event, ProfileContentSymbol, () => {
    const profile = JSON.parse(event.content) as ProfileContent;

    // ensure nip05 is a string
    if (profile.nip05 && typeof profile.nip05 !== "string") profile.nip05 = String(profile.nip05);

    // add missing protocol to website
    if (profile.website?.startsWith("http") === false) {
      profile.website = "https://" + profile.website;
    }

    return profile;
  });
}
