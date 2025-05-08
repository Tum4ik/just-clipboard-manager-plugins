import packageJson from "./package.json" with { type: "json" };
import { ImagesPlugin } from "./src/images-plugin.js";

export const pluginInstance = new ImagesPlugin(packageJson);
