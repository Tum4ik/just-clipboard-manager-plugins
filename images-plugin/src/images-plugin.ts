import { ClipboardDataPlugin, RepresentationData } from "just-clipboard-manager-pdk";
import { resize } from "./functions/resize.js";
import { retrievePixelsData } from "./functions/retrieve-pixels-data.js";

export class ImagesPlugin extends ClipboardDataPlugin {
  private readonly _representationFormats: readonly string[] = ['CF_DIBV5'];
  override get representationFormats(): readonly string[] {
    return this._representationFormats;
  }

  private readonly _formatsToSave = ['CF_DIBV5', 'CF_DIB'];
  override get formatsToSave(): readonly string[] {
    return this._formatsToSave;
  }

  override extractRepresentationData(data: Uint8Array, format: string): { representationData: RepresentationData; searchLabel?: string; } {
    const { pixels, width, height } = retrievePixelsData(data.buffer);
    const resizeResult = resize(pixels, width, height, 48);
    const metadata = {
      previewWidth: resizeResult.width,
      previewHeight: resizeResult.height
    } as ImageSize;
    return { representationData: { data: new Uint8Array(resizeResult.pixels), metadata } };
  }

  override getRepresentationDataElement(representationData: RepresentationData, format: string, document: Document): HTMLElement {
    const { previewWidth, previewHeight } = representationData.metadata as ImageSize;
    const canvas = document.createElement('canvas');
    canvas.width = previewWidth;
    canvas.height = previewHeight;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(previewWidth, previewHeight);
    imageData.data.set(representationData.data);
    ctx?.putImageData(imageData, 0, 0);
    return canvas;
  }

  override getFullDataPreviewElement(data: Uint8Array, format: string, document: Document): HTMLElement {
    const { pixels, width, height } = retrievePixelsData(data.buffer);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    const imageData = new ImageData(width, height);
    imageData.data.set(pixels);
    ctx?.putImageData(imageData, 0, 0);
    return canvas;
  }
}


type ImageSize = {
  previewWidth: number;
  previewHeight: number;
};
