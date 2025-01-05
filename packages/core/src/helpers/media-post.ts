import { NostrEvent } from "nostr-tools";
import { getMediaAttachments } from "./file-metadata.js";

export const MEDIA_POST_KIND = 20;

/** Return the media attachments from a kind 20 media post */
export function getMediaPostAttachments(post: NostrEvent) {
  return getMediaAttachments(post);
}
