import { describe, expect, it } from "vitest";
import { parseMediaAttachmentTag } from "./media-attachment.js";

describe("media attachment helpers", () => {
  describe("parseMediaAttachmentTag", () => {
    it("should parse simple imeta tag", () => {
      expect(
        parseMediaAttachmentTag([
          "imeta",
          "url https://blossom.primal.net/3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c.jpg",
          "x 3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c",
          "dim 1024x1024",
          "m image/jpeg",
          "blurhash ggH{Aws:RPWBRjaeay?^ozV@aeRjaej[$gt7kCofWVofkCrrofxuofa|ozbHx]s:tRofaet7ay",
        ]),
      ).toEqual({
        url: "https://blossom.primal.net/3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c.jpg",
        sha256: "3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c",
        dimensions: "1024x1024",
        type: "image/jpeg",
        blurhash: "ggH{Aws:RPWBRjaeay?^ozV@aeRjaej[$gt7kCofWVofkCrrofxuofa|ozbHx]s:tRofaet7ay",
      });
    });

    it("should parse thumbnail url", () => {
      expect(
        parseMediaAttachmentTag([
          "imeta",
          "url https://blossom.primal.net/3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c.jpg",
          "x 3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c",
          "dim 1024x1024",
          "m image/jpeg",
          "blurhash ggH{Aws:RPWBRjaeay?^ozV@aeRjaej[$gt7kCofWVofkCrrofxuofa|ozbHx]s:tRofaet7ay",
          "thumb https://exmaple.com/thumb.jpg",
        ]),
      ).toEqual({
        url: "https://blossom.primal.net/3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c.jpg",
        sha256: "3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c",
        dimensions: "1024x1024",
        type: "image/jpeg",
        blurhash: "ggH{Aws:RPWBRjaeay?^ozV@aeRjaej[$gt7kCofWVofkCrrofxuofa|ozbHx]s:tRofaet7ay",
        thumbnail: "https://exmaple.com/thumb.jpg",
      });
    });

    it("should parse multiple fallback urls", () => {
      expect(
        parseMediaAttachmentTag([
          "imeta",
          "url https://blossom.primal.net/3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c.jpg",
          "x 3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c",
          "dim 1024x1024",
          "m image/jpeg",
          "blurhash ggH{Aws:RPWBRjaeay?^ozV@aeRjaej[$gt7kCofWVofkCrrofxuofa|ozbHx]s:tRofaet7ay",
          "fallback https://exmaple.com/image2.jpg",
          "fallback https://exmaple.com/image3.jpg",
        ]),
      ).toEqual({
        url: "https://blossom.primal.net/3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c.jpg",
        sha256: "3f4dbf2797ac4e90b00bcfe2728e5c8367ed909c48230ac454cc325f1993646c",
        dimensions: "1024x1024",
        type: "image/jpeg",
        blurhash: "ggH{Aws:RPWBRjaeay?^ozV@aeRjaej[$gt7kCofWVofkCrrofxuofa|ozbHx]s:tRofaet7ay",
        fallback: ["https://exmaple.com/image2.jpg", "https://exmaple.com/image3.jpg"],
      });
    });
  });
});
