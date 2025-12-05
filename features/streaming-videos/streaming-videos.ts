// StreamingVideoManager: Handles streaming upload/download for videos
import type { VideoPayload, StreamingVideoOptions } from './types.js';
import { PassThrough } from 'stream';
const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

export class StreamingVideoManager {
  private options: StreamingVideoOptions;
  constructor(config: { streamingVideos?: StreamingVideoOptions } = {}) {
    this.options = config.streamingVideos || {};
  }

  /**
   * Upload video (supports FormData, Blob, ReadableStream, Node.js stream)
   * Progress callback: (sentBytes, totalBytes) => void
   */
  async upload(
    url: string,
    video: VideoPayload,
    headers: Record<string, string> = {},
    onProgress?: (sentBytes: number, totalBytes?: number) => void
  ): Promise<Response> {
    const opts = this.options;
    if (opts.validatePayload && !opts.validatePayload(video)) {
      throw new Error('StreamingVideoManager.upload: Invalid video payload');
    }
    try {
      if (isNode && video instanceof PassThrough) {
        let sentBytes = 0;
        video.on('data', (chunk: Buffer) => {
          sentBytes += chunk.length;
          if (onProgress) onProgress(sentBytes);
          if (opts.onProgress) opts.onProgress(sentBytes);
        });
        return await fetch(url, {
          method: 'POST',
          headers,
          body: video as any
        });
      } else if (!isNode && (video instanceof ReadableStream || video instanceof Blob || video instanceof File || video instanceof FormData)) {
        let totalBytes = (video as any).size || undefined;
        let sentBytes = 0;
        if ((onProgress || opts.onProgress) && (video instanceof Blob || video instanceof File)) {
          const stream = (video as Blob).stream();
          const trackedStream = new ReadableStream({
            start(controller) {
              const reader = stream.getReader();
              function pump() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  sentBytes += value.length;
                  if (onProgress) onProgress(sentBytes, totalBytes);
                  if (opts.onProgress) opts.onProgress(sentBytes, totalBytes);
                  controller.enqueue(value);
                  pump();
                });
              }
              pump();
            }
          });
          return await fetch(url, {
            method: 'POST',
            headers,
            body: trackedStream as any
          });
        }
        return await fetch(url, {
          method: 'POST',
          headers,
          body: video as any
        });
      } else {
        return await fetch(url, {
          method: 'POST',
          headers,
          body: video as any
        });
      }
    } catch (err: any) {
      throw new Error(`StreamingVideoManager.upload failed: ${err?.message || err}`);
    }
  }

  /**
   * Download video as stream
   * Progress callback: (receivedBytes, totalBytes) => void
   */
  async download(
    url: string,
    headers: Record<string, string> = {},
    onProgress?: (receivedBytes: number, totalBytes?: number) => void
  ): Promise<ReadableStream | NodeJS.ReadableStream> {
    const opts = this.options;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`StreamingVideoManager.download failed: ${response.status}`);
    const totalBytes = Number(response.headers.get('content-length')) || undefined;
    if (!response.body) {
      throw new Error('StreamingVideoManager.download: No response body stream available');
    }
    let receivedBytes = 0;
    if (onProgress || opts.onProgress) {
      const trackedStream = new ReadableStream({
        start(controller) {
          if (!response.body) throw new Error('StreamingVideoManager.download: No response body stream available');
          const reader = response.body.getReader();
          function pump() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              receivedBytes += value.length;
              if (onProgress) onProgress(receivedBytes, totalBytes);
              if (opts.onProgress) opts.onProgress(receivedBytes, totalBytes);
              controller.enqueue(value);
              pump();
            });
          }
          pump();
        }
      });
      return trackedStream;
    }
    return response.body as ReadableStream;
  }
}
