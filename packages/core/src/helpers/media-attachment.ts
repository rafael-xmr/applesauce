import { NostrEvent } from "nostr-tools";
import { getOrComputeCachedValue } from "./cache.js";

export type MediaAttachment = {
  /** URL of the file */
  url: string;
  /** MIME type */
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
  thumbnail?: string;
  /** URL to a preview image with the same dimensions */
  image?: string;
  /** summary */
  summary?: string;
  /** description for accessability */
  alt?: string;
  /** blurhash */
  blurhash?: string;
  /** fallback URLs */
  fallback?: string[];
};

/**
 * Parses a imeta tag into a {@link MediaAttachment}
 * @throws
 */
export function parseMediaAttachmentTag(tag: string[]): MediaAttachment {
  const parts = tag.slice(1);
  const fields: Record<string, string> = {};

  let fallback: string[] | undefined = undefined;

  for (const part of parts) {
    const match = part.match(/^(.+?)\s(.+)$/);
    if (match) {
      const [_, name, value] = match;

      switch (name) {
        case "fallback":
          fallback = fallback ? [...fallback, value] : [value];
          break;
        default:
          fields[name] = value;
          break;
      }
    }
  }

  if (!fields.url) throw new Error("Missing required url in attachment");
  const attachment: MediaAttachment = { url: fields.url, fallback };

  // parse size
  if (fields.size) attachment.size = parseInt(fields.size);

  // copy optional fields
  if (fields.m) attachment.type = fields.m;
  if (fields.x) attachment.sha256 = fields.x;
  if (fields.dim) attachment.dimensions = fields.dim;
  if (fields.magnet) attachment.magnet = fields.magnet;
  if (fields.i) attachment.infohash = fields.i;
  if (fields.thumb) attachment.thumbnail = fields.thumb;
  if (fields.image) attachment.image = fields.image;
  if (fields.summary) attachment.summary = fields.summary;
  if (fields.alt) attachment.alt = fields.alt;
  if (fields.blurhash) attachment.blurhash = fields.blurhash;

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
