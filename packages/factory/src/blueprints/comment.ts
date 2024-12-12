import { NostrEvent } from "nostr-tools";
import { COMMENT_KIND } from "applesauce-core/helpers";

import { EventFactory, EventFactoryBlueprint } from "../event-factory.js";
import { createTextContentOperations, TextContentOptions } from "../operations/content.js";
import { includeCommentTags } from "../operations/comment.js";

export function CommentBlueprint(
  parent: NostrEvent,
  content: string,
  options?: TextContentOptions,
): EventFactoryBlueprint {
  return (ctx) =>
    EventFactory.runProcess(
      { kind: COMMENT_KIND },
      ctx,
      includeCommentTags(parent),
      ...createTextContentOperations(content, options),
    );
}
