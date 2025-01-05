import { MediaAttachment, MEDIA_POST_KIND } from "applesauce-core/helpers";

import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { includeMediaAttachmentTags } from "../operations/media-attachment.js";

/** A blueprint to create a kind 20 media post */
export function MediaPostBlueprint(
  media: MediaAttachment[],
  content: string,
  options?: TextContentOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: MEDIA_POST_KIND },
      ctx,
      includeMediaAttachmentTags(media),
      ...createTextContentOperations(content, options),
    );
}
