// StreamingImageManager: Handles streaming upload/download for images

import type { ImagePayload, StreamingImageOptions } from './types.js';
import { uploadStream, downloadStream } from '@0xshariq/voxa-core';

/**
 * StreamingImageManager - Manages image upload/download with streaming support
 * Supports progress tracking and various payload types (Blob, File, FormData, ReadableStream)
 */
export class StreamingImageManager {
  private options: StreamingImageOptions;
  
  constructor(config: { streamingImages?: StreamingImageOptions } = {}) {
    this.options = config.streamingImages || {};
  }

  /**
   * Upload image with streaming and progress tracking
   * @param url - Upload endpoint URL
   * @param image - Image payload (Blob, File, FormData, ReadableStream, or Node.js stream)
   * @param headers - Request headers
   * @param onProgress - Progress callback (sentBytes, totalBytes) => void
   * @returns Promise resolving to Response object
   */
  async upload(
    url: string,
    image: ImagePayload,
    headers: Record<string, string> = {},
    onProgress?: (sentBytes: number, totalBytes?: number) => void
  ): Promise<Response> {
    if (this.options.validatePayload && !this.options.validatePayload(image)) {
      throw new Error('StreamingImageManager.upload: Invalid image payload');
    }

    try {
      return await uploadStream(url, image, headers, this.options, onProgress);
    } catch (err: any) {
      throw new Error(`StreamingImageManager.upload failed: ${err?.message || err}`);
    }
  }

  /**
   * Download image as stream with progress tracking
   * @param url - Download URL
   * @param headers - Request headers
   * @param onProgress - Progress callback (receivedBytes, totalBytes) => void
   * @returns Promise resolving to Blob
   */
  async download(
    url: string,
    headers: Record<string, string> = {},
    onProgress?: (receivedBytes: number, totalBytes?: number) => void
  ): Promise<Blob> {
    try {
      return await downloadStream(url, headers, this.options, onProgress);
    } catch (err: any) {
      throw new Error(`StreamingImageManager.download failed: ${err?.message || err}`);
    }
  }
}
