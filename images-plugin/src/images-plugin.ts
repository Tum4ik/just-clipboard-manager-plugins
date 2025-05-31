import { ClipboardDataPlugin, RepresentationData } from "just-clipboard-manager-pdk";
import { resize } from "./functions/resize.js";
import { retrievePixelsData } from "./functions/retrieve-pixels-data.js";

export class ImagesPlugin extends ClipboardDataPlugin {
  private readonly _formats: readonly string[] = ['CF_DIBV5'/* , 'CF_DIB' */];
  override get formats(): readonly string[] {
    return this._formats;
  }

  override extractRepresentationData(data: Uint8Array, format: string): RepresentationData {
    const { pixels, width, height } = retrievePixelsData(data.buffer);
    const resizeResult = resize(pixels, width, height, 48);
    const metadata = { width: resizeResult.width, height: resizeResult.height } as ImageSize;
    return { data: new Uint8Array(resizeResult.pixels), metadata };
  }

  override getRepresentationDataElement(representationData: RepresentationData, format: string, document: Document): HTMLElement {
    const { width, height } = representationData.metadata as ImageSize;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(width, height);
    imageData.data.set(representationData.data);
    ctx?.putImageData(imageData, 0, 0);
    return canvas;
  }

  override getSearchLabel(data: Uint8Array, format: string): string | null {
    return null;
  }
}


type ImageSize = { width: number, height: number; };
