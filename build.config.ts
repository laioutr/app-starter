import { defineBuildConfig } from "unbuild";

export default defineBuildConfig({
  // Other unbuild configuration...
  externals: [
    // Add other external dependencies if you have them...
    "defu",
  ],
});
