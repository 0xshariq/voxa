// StreamingVideoManager: Handles streaming upload/download for videos

import type { VideoPayload, StreamingVideoOptions } from './types.js';
import { uploadStream, downloadStream } from '@0xshariq/voxa-core';

/**
 * StreamingVideoManager - Manages video upload/download with streaming support
 * Supports progress tracking and various payload types (Blob, File, FormData, ReadableStream)
 */
export class StreamingVideoManager {
  private options: StreamingVideoOptions;
  
  constructor(config: { streamingVideos?: StreamingVideoOptions } = {}) {
    this.options = config.streamingVideos || {};
  }

  /**
   * Upload video with streaming and progress tracking
   * @param url - Upload endpoint URL
   * @param video - Video payload (Blob, File, FormData, ReadableStream, or Node.js stream)
   * @param headers - Request headers
   * @param onProgress - Progress callback (sentBytes, totalBytes) => void
   * @returns Promise resolving to Response object
   */
  async upload(
    url: string,
    video: VideoPayload,
    headers: Record<string, string> = {},
    onProgress?: (sentBytes: number, totalBytes?: number) => void
  ): Promise<Response> {
    if (this.options.validatePayload && !this.options.validatePayload(video)) {
      throw new Error('StreamingVideoManager.upload: Invalid video payload');
    }

    try {
      return await uploadStream(url, video, headers, this.options, onProgress);
    } catch (err: any) {
      throw new Error(`StreamingVideoManager.upload failed: ${err?.message || err}`);
    }
  }

  /**
   * Download video as stream with progress tracking
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
      throw new Error(`StreamingVideoManager.download failed: ${err?.message || err}`);
    }
  }
}
