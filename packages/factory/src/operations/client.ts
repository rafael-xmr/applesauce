import { AddressPointer } from "nostr-tools/nip19";
import { getCoordinateFromAddressPointer } from "applesauce-core/helpers";
import { EventFactoryOperation } from "../event-factory.js";
import { includeSingletonTag } from "./tags.js";

export function includeClientTag(name: string, pointer?: AddressPointer): EventFactoryOperation {
  return includeSingletonTag(pointer ? ["client", name, getCoordinateFromAddressPointer(pointer)] : ["client", name]);
}
