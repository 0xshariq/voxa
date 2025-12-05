export type VideoPayload = Blob | File | FormData | ReadableStream<Uint8Array> | NodeJS.ReadableStream;

export interface StreamingVideoOptions {
    enabled?: boolean;
    chunkSize?: number;
    onProgress?: (sentOrReceivedBytes: number, totalBytes?: number) => void;
    maxSize?: number;
    mimeTypes?: string[];
    validatePayload?: (payload: VideoPayload) => boolean;
}

declare module '@0xshariq/voxa-core' {
    interface VoxaConfig {
        streamingVideos?: StreamingVideoOptions;
    }
}
