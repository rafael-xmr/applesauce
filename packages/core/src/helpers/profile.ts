import { kinds, NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";

export const ProfileContentSymbol = Symbol.for("profile-content");

export type ProfileContent = {
	name?: string;
	/** @deprecated use name instead */
	username?: string;
	display_name?: string;
	/** @deprecated use display_name instead */
	displayName?: string;
	about?: string;
	/** @deprecated use picture instead */
	image?: string;
	picture?: string;
	banner?: string;
	website?: string;
	lud16?: string;
	lud06?: string;
	nip05?: string;
	cryptocurrency_addresses?: {
		monero?: string;
	};
};

/** Returns the parsed profile content for a kind 0 event */
export function getProfileContent(event: NostrEvent) {
	return getOrComputeCachedValue(event, ProfileContentSymbol, () => {
		const profile = JSON.parse(event.content) as ProfileContent;

		// ensure nip05 is a string
		if (profile.nip05 && typeof profile.nip05 !== "string")
			profile.nip05 = String(profile.nip05);

		// add missing protocol to website
		if (
			profile.website &&
			profile.website?.length > 0 &&
			profile.website?.startsWith("http") === false
		) {
			profile.website = "https://" + profile.website;
		}

		return profile;
	});
}

/** Checks if the content of the kind 0 event is valid JSON */
export function isValidProfile(profile?: NostrEvent) {
	if (!profile) return false;
	if (profile.kind !== kinds.Metadata) return false;
	try {
		getProfileContent(profile);

		return true;
	} catch (error) {
		return false;
	}
}

/** Gets the display name from a profile with fallbacks */
export function getDisplayName(metadata?: ProfileContent) {
	return metadata?.display_name || metadata?.displayName || metadata?.name;
}
