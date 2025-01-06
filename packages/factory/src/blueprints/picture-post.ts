import { MediaAttachment, PICTURE_POST_KIND } from "applesauce-core/helpers";

import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeMediaAttachmentTags } from "../operations/media-attachment.js";
import { includePicturePostImageTags } from "../operations/picture-post.js";
import { includeHashtags } from "../operations/hashtags.js";

export type PicturePostBlueprintOptions = TextContentOptions & {
  hashtags?: string[];
};

/**
 * A blueprint to create a kind 20 picture post
 * @see https://github.com/nostr-protocol/nips/blob/master/68.md
 */
export function PicturePostBlueprint(
  pictures: MediaAttachment[],
  content: string,
  options?: PicturePostBlueprintOptions,
): EventFactoryBlueprint {
  if (pictures.some((m) => !m.type?.includes("image/")))
    throw new Error("Only image/* types can be added to a picture post");

  return (ctx) =>
    EventFactory.runProcess(
      { kind: PICTURE_POST_KIND },
      ctx,
      includeMediaAttachmentTags(pictures),
      includePicturePostImageTags(pictures),
      ...createTextContentOperations(content, options),
      options?.hashtags ? includeHashtags(options.hashtags) : undefined,
    );
}
