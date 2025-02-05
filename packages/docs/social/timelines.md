# Timelines

The [TimelineLoader](https://hzrd149.github.io/applesauce/typedoc/classes/applesauce_loaders.TimelineLoader.html) class can be used to load a timeline of events.

```ts
import { TimelineLoader } from "applesauce-loaders";

const loader = new TimelineLoader(rxNostr, TimelineLoader.simpleFilterMap(relays, [{ kinds: [1], authors: pubkeys }]), {
  // limit each page to 100 events
  limit: 100,
});

loader.subscribe((packet) => {
  console.log(packet.event);
});

// load first page
loader.next();
```
