/**
 * Voxa HTTP Client - Streaming Utilities
 * Shared utilities for streaming operations (images, videos, files)
 */

import { PassThrough } from 'stream';
import { isNode } from './constants.js';

export interface StreamingOptions {
  enabled?: boolean;
  chunkSize?: number;
  onProgress?: (sentOrReceivedBytes: number, totalBytes?: number) => void;
  maxSize?: number;
  mimeTypes?: string[];
}

export type StreamablePayload = Blob | File | FormData | ReadableStream<Uint8Array> | NodeJS.ReadableStream;

/**
 * Upload streaming data with progress tracking
 * Supports both Node.js and browser environments
 */
export async function uploadStream(
  url: string,
  payload: StreamablePayload,
  headers: Record<string, string> = {},
  options: StreamingOptions = {},
  onProgress?: (sentBytes: number, totalBytes?: number) => void
): Promise<Response> {
  const { onProgress: configProgress, validatePayload } = options as any;

  // Validate payload if validator provided
  if (validatePayload && !validatePayload(payload)) {
    throw new Error('Invalid streaming payload');
  }

  // Node.js environment: Handle PassThrough streams
  if (isNode && payload instanceof PassThrough) {
    let sentBytes = 0;
    payload.on('data', (chunk: Buffer) => {
      sentBytes += chunk.length;
      if (onProgress) onProgress(sentBytes);
      if (configProgress) configProgress(sentBytes);
    });
    
    return await fetch(url, {
      method: 'POST',
      headers,
      body: payload as any,
    });
  }

  // Browser environment: Handle Blob, File, FormData, ReadableStream
  if (!isNode && (payload instanceof ReadableStream || payload instanceof Blob || 
      payload instanceof File || payload instanceof FormData)) {
    
    const totalBytes = (payload as any).size || undefined;
    let sentBytes = 0;

    // Track progress for Blob/File
    if ((onProgress || configProgress) && (payload instanceof Blob || payload instanceof File)) {
      const stream = (payload as Blob).stream();
      const trackedStream = new ReadableStream({
        start(controller) {
          const reader = stream.getReader();
          function pump(): any {
            return reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              sentBytes += value.byteLength;
              if (onProgress) onProgress(sentBytes, totalBytes);
              if (configProgress) configProgress(sentBytes, totalBytes);
              controller.enqueue(value);
              return pump();
            });
          }
          return pump();
        },
      });

      return await fetch(url, {
        method: 'POST',
        headers,
        body: trackedStream,
      });
    }

    // No progress tracking needed
    return await fetch(url, {
      method: 'POST',
      headers,
      body: payload as any,
    });
  }

  throw new Error('Unsupported payload type for streaming upload');
}

/**
 * Download streaming data with progress tracking
 * Supports chunked downloads with progress callbacks
 */
export async function downloadStream(
  url: string,
  headers: Record<string, string> = {},
  options: StreamingOptions = {},
  onProgress?: (receivedBytes: number, totalBytes?: number) => void
): Promise<Blob> {
  const { onProgress: configProgress } = options;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = contentLength ? parseInt(contentLength, 10) : undefined;

  if (!response.body) {
    throw new Error('Response body is null');
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    receivedBytes += value.byteLength;

    if (onProgress) onProgress(receivedBytes, totalBytes);
    if (configProgress) configProgress(receivedBytes, totalBytes);
  }

  // Combine all chunks into a single Blob
  return new Blob(chunks);
}

/**
 * Validate MIME type against allowed types
 */
export function validateMimeType(file: Blob | File, allowedTypes?: string[]): boolean {
  if (!allowedTypes || allowedTypes.length === 0) return true;
  
  const fileType = file.type;
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const category = type.split('/')[0];
      return fileType.startsWith(category + '/');
    }
    return fileType === type;
  });
}

/**
 * Validate file size against maximum allowed size
 */
export function validateFileSize(file: Blob | File, maxSize?: number): boolean {
  if (!maxSize) return true;
  return file.size <= maxSize;
}

/**
 * Create a tracked stream for progress monitoring
 */
export function createProgressStream(
  stream: ReadableStream<Uint8Array>,
  onProgress: (bytes: number, total?: number) => void,
  totalBytes?: number
): ReadableStream<Uint8Array> {
  let receivedBytes = 0;

  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader();
      
      function pump(): any {
        return reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          
          receivedBytes += value.byteLength;
          onProgress(receivedBytes, totalBytes);
          controller.enqueue(value);
          
          return pump();
        });
      }
      
      return pump();
    },
  });
}
