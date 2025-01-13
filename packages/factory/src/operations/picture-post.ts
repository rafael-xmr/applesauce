import { MediaAttachment } from "applesauce-core/helpers";

import { EventFactoryOperation } from "../event-factory.js";
import { ensureNamedValueTag } from "../helpers/tag.js";

/** Includes the "x" and "m" tags for kind 20 picture posts */
export function includePicturePostImageTags(pictures: MediaAttachment[]): EventFactoryOperation {
  return (draft) => {
    let tags = Array.from(draft.tags);

    for (const image of pictures) {
      if (image.sha256) tags = ensureNamedValueTag(tags, ["x", image.sha256]);
      if (image.type) tags = ensureNamedValueTag(tags, ["m", image.type]);
    }

    return { ...draft, tags };
  };
}
