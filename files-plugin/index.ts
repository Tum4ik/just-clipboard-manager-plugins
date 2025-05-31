import packageJson from "./package.json" with { type: "json" };
import { FilesPlugin } from "./src/files-plugin.js";

export const pluginInstance = new FilesPlugin(packageJson);
