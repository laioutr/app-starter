import type { MediaImage } from "@laioutr-core/canonical-types";
import type { Image as CtImage } from "@commercetools/platform-sdk";

export const mapImage = (img: CtImage): MediaImage => ({
  type: "image",
  sources: [
    {
      src: img.url,
      provider: "commercetools",
      width: img.dimensions?.w,
      height: img.dimensions?.h,
    },
  ],
  alt: img.label ?? "",
});
