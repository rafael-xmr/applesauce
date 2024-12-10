import { NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";

export type MediaAttachment = {
  /** URL of the file */
  url: string;
  /** mime type */
  type?: string;
  /** sha256 hash of the file */
  sha256?: string;
  /** size of the file in bytes */
  size?: number;
  /** size of file in pixels in the form <width>x<height> */
  dimensions?: string;
  /** magnet */
  magnet?: string;
  /** torrent infohash */
  infohash?: string;
  /** URL to a thumbnail */
  thumb?: string;
  /** URL to a preview image with the same dimensions */
  image?: string;
  /** summary */
  summary?: string;
  /** description for accessability */
  alt?: string;
  /** fallback URL */
  // fallback?: string[];
};

/**
 * Parses a imeta tag into a {@link MediaAttachment}
 * @throws
 */
export function parseMediaAttachmentTag(tag: string[]): MediaAttachment {
  const parts = tag.slice(1);
  const fields: Record<string, string> = {};

  for (const part of parts) {
    const match = part.match(/^(.+?)\s(.+)$/);
    if (match) {
      const [_, name, value] = match;
      fields[name] = value;
    }
  }

  if (!fields.url) throw new Error("Missing required url in attachment");
  const attachment: MediaAttachment = { url: fields.url };

  // parse size
  if (fields.size) attachment.size = parseInt(fields.size);

  // copy optional fields
  if (fields.m) attachment.type = fields.m;
  if (fields.x) attachment.sha256 = fields.x;
  if (fields.dim) attachment.dimensions = fields.dim;
  if (fields.magnet) attachment.magnet = fields.magnet;
  if (fields.i) attachment.infohash = fields.i;
  if (fields.thumb) attachment.thumb = fields.thumb;
  if (fields.image) attachment.image = fields.image;
  if (fields.summary) attachment.summary = fields.summary;
  if (fields.alt) attachment.alt = fields.alt;

  return attachment;
}

export const MediaAttachmentsSymbol = Symbol.for("media-attachments");

/** Gets all the media attachments on an event */
export function getMediaAttachments(event: NostrEvent): MediaAttachment[] {
  return getOrComputeCachedValue(event, MediaAttachmentsSymbol, () => {
    return event.tags
      .filter((t) => t[0] === "imeta")
      .map((tag) => {
        try {
          return parseMediaAttachmentTag(tag);
        } catch (error) {
          // ignore invalid attachments
          return undefined;
        }
      })
      .filter((a) => !!a);
  });
}
