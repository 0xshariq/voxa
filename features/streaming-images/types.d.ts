export type ImagePayload = Blob | File | FormData | ReadableStream<Uint8Array> | NodeJS.ReadableStream;

export interface StreamingImageOptions {
    enabled?: boolean;
    chunkSize?: number;
    onProgress?: (sentOrReceivedBytes: number, totalBytes?: number) => void;
    maxSize?: number;
    mimeTypes?: string[];
    validatePayload?: (payload: ImagePayload) => boolean;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        streamingImages?: StreamingImageOptions;
    }
}
