# Streaming Features

Voxa provides powerful streaming capabilities for uploading and downloading images and videos with progress tracking, validation hooks, and cross-platform support.

## Table of Contents

- [Overview](#overview)
- [StreamingImageManager](#streamingimagemanager)
- [StreamingVideoManager](#streamingvideomanager)
- [Configuration](#configuration)
- [Upload Examples](#upload-examples)
- [Download Examples](#download-examples)
- [Progress Tracking](#progress-tracking)
- [Error Handling](#error-handling)
- [Cross-Platform Support](#cross-platform-support)

## Overview

Voxa includes two dedicated managers for streaming operations:

- **StreamingImageManager**: Handle image uploads/downloads with progress tracking
- **StreamingVideoManager**: Handle video uploads/downloads with progress tracking

Both managers support:
- Multiple payload formats (Blob, File, FormData, ReadableStream, Node.js streams)
- Progress callbacks for upload/download tracking
- Custom validation hooks
- Cross-platform compatibility (Node.js and browsers)
- Error context with detailed information

## StreamingImageManager

### Basic Usage

```typescript
import { StreamingImageManager } from '@0xshariq/voxa';

// Initialize with configuration
const streamingImages = new StreamingImageManager({
  streamingImages: {
    validatePayload: (image) => {
      // Custom validation logic
      return image instanceof Blob || image instanceof File;
    },
    onProgress: (sent, total) => {
      console.log(`Progress: ${sent}/${total} bytes`);
    },
    onError: (error) => {
      console.error('Streaming error:', error);
    }
  }
});
```

### Upload Image

```typescript
// Upload from File input (Browser)
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

await streamingImages.upload(
  'https://api.example.com/images/upload',
  file,
  { 'Content-Type': 'image/jpeg' },
  (sentBytes, totalBytes) => {
    const percentage = (sentBytes / totalBytes) * 100;
    console.log(`Upload progress: ${percentage.toFixed(2)}%`);
  }
);
```

### Upload with FormData

```typescript
const formData = new FormData();
formData.append('image', file);
formData.append('title', 'My Image');
formData.append('description', 'A beautiful landscape');

await streamingImages.upload(
  'https://api.example.com/images/upload',
  formData,
  {},
  (sentBytes, totalBytes) => {
    updateProgressBar(sentBytes, totalBytes);
  }
);
```

### Download Image

```typescript
const response = await streamingImages.download(
  'https://api.example.com/images/12345',
  {},
  (receivedBytes, totalBytes) => {
    if (totalBytes) {
      const percentage = (receivedBytes / totalBytes) * 100;
      console.log(`Download progress: ${percentage.toFixed(2)}%`);
    }
  }
);

// Convert to Blob
const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
document.getElementById('preview').src = imageUrl;
```

## StreamingVideoManager

### Basic Usage

```typescript
import { StreamingVideoManager } from '@0xshariq/voxa';

const streamingVideos = new StreamingVideoManager({
  streamingVideos: {
    validatePayload: (video) => {
      // Validate video size (max 100MB)
      if (video instanceof File && video.size > 100 * 1024 * 1024) {
        return false;
      }
      return true;
    },
    onProgress: (sent, total) => {
      updateVideoUploadProgress(sent, total);
    }
  }
});
```

### Upload Video with Progress

```typescript
const videoFile = document.querySelector('input[type="file"]').files[0];

try {
  const response = await streamingVideos.upload(
    'https://api.example.com/videos/upload',
    videoFile,
    { 
      'Content-Type': 'video/mp4',
      'Authorization': 'Bearer token123'
    },
    (sentBytes, totalBytes) => {
      const percentage = ((sentBytes / totalBytes) * 100).toFixed(2);
      document.getElementById('progress').textContent = `${percentage}%`;
      document.getElementById('progress-bar').style.width = `${percentage}%`;
    }
  );

  const result = await response.json();
  console.log('Video uploaded:', result.videoId);
} catch (error) {
  console.error('Upload failed:', error);
}
```

### Download Video Stream

```typescript
const response = await streamingVideos.download(
  'https://api.example.com/videos/67890',
  { 'Range': 'bytes=0-1024000' }, // Download first 1MB
  (receivedBytes, totalBytes) => {
    console.log(`Downloaded: ${receivedBytes} / ${totalBytes} bytes`);
  }
);

// Stream to video element
const blob = await response.blob();
const videoUrl = URL.createObjectURL(blob);
document.getElementById('video-player').src = videoUrl;
```

## Configuration

### StreamingImageOptions

```typescript
interface StreamingImageOptions {
  validatePayload?: (payload: ImagePayload) => boolean;
  onProgress?: (sent: number, total?: number) => void;
  onError?: (error: Error) => void;
}
```

### StreamingVideoOptions

```typescript
interface StreamingVideoOptions {
  validatePayload?: (payload: VideoPayload) => boolean;
  onProgress?: (sent: number, total?: number) => void;
  onError?: (error: Error) => void;
}
```

### Full Configuration Example

```typescript
import create from '@0xshariq/voxa';

const api = create({
  baseURL: 'https://api.example.com',
  streamingImages: {
    validatePayload: (image) => {
      // Only allow images under 10MB
      if (image instanceof File) {
        return image.size <= 10 * 1024 * 1024;
      }
      return true;
    },
    onProgress: (sent, total) => {
      console.log(`Image: ${sent}/${total} bytes`);
    },
    onError: (error) => {
      alert(`Image upload failed: ${error.message}`);
    }
  },
  streamingVideos: {
    validatePayload: (video) => {
      // Only allow videos under 100MB
      if (video instanceof File) {
        return video.size <= 100 * 1024 * 1024;
      }
      return true;
    },
    onProgress: (sent, total) => {
      console.log(`Video: ${sent}/${total} bytes`);
    },
    onError: (error) => {
      alert(`Video upload failed: ${error.message}`);
    }
  }
});
```

## Upload Examples

### Node.js Upload (File System)

```typescript
import fs from 'fs';
import { PassThrough } from 'stream';

// Create readable stream from file
const fileStream = fs.createReadStream('./video.mp4');
const passThrough = new PassThrough();
fileStream.pipe(passThrough);

await streamingVideos.upload(
  'https://api.example.com/videos/upload',
  passThrough,
  { 'Content-Type': 'video/mp4' },
  (sent, total) => {
    console.log(`Uploaded: ${sent} bytes`);
  }
);
```

### Browser Upload with Drag & Drop

```typescript
// HTML
// <div id="drop-zone">Drop files here</div>

const dropZone = document.getElementById('drop-zone');

dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  
  if (file.type.startsWith('image/')) {
    await streamingImages.upload(
      '/api/images/upload',
      file,
      {},
      (sent, total) => {
        console.log(`Progress: ${((sent/total)*100).toFixed(0)}%`);
      }
    );
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
});
```

### Multiple File Upload

```typescript
const files = document.querySelector('input[type="file"]').files;

for (const file of files) {
  const manager = file.type.startsWith('image/') 
    ? streamingImages 
    : streamingVideos;
  
  await manager.upload(
    '/api/upload',
    file,
    { 'X-File-Name': file.name },
    (sent, total) => {
      console.log(`${file.name}: ${((sent/total)*100).toFixed(0)}%`);
    }
  );
}
```

## Download Examples

### Download with Progress Bar

```typescript
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status');

const response = await streamingImages.download(
  'https://api.example.com/images/large-photo.jpg',
  {},
  (received, total) => {
    if (total) {
      const percentage = (received / total) * 100;
      progressBar.style.width = `${percentage}%`;
      statusText.textContent = `${percentage.toFixed(0)}% (${received}/${total} bytes)`;
    } else {
      statusText.textContent = `${received} bytes downloaded`;
    }
  }
);

const blob = await response.blob();
const url = URL.createObjectURL(blob);
// Use the URL...
```

### Download and Save (Node.js)

```typescript
import fs from 'fs';

const response = await streamingVideos.download(
  'https://api.example.com/videos/movie.mp4',
  {},
  (received, total) => {
    console.log(`Downloaded: ${received}/${total} bytes`);
  }
);

const buffer = Buffer.from(await response.arrayBuffer());
fs.writeFileSync('./downloaded-video.mp4', buffer);
```

## Progress Tracking

### Advanced Progress Implementation

```typescript
class UploadProgressTracker {
  private startTime: number;
  
  constructor() {
    this.startTime = Date.now();
  }
  
  onProgress(sent: number, total?: number) {
    const elapsed = Date.now() - this.startTime;
    const speed = sent / (elapsed / 1000); // bytes per second
    const remaining = total ? (total - sent) / speed : undefined;
    
    console.log({
      sent: this.formatBytes(sent),
      total: total ? this.formatBytes(total) : 'unknown',
      percentage: total ? ((sent / total) * 100).toFixed(2) + '%' : 'N/A',
      speed: this.formatBytes(speed) + '/s',
      remaining: remaining ? this.formatTime(remaining) : 'unknown'
    });
  }
  
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
  
  private formatTime(seconds: number): string {
    if (seconds < 60) return seconds.toFixed(0) + 's';
    if (seconds < 3600) return (seconds / 60).toFixed(0) + 'm';
    return (seconds / 3600).toFixed(1) + 'h';
  }
}

// Usage
const tracker = new UploadProgressTracker();
await streamingVideos.upload(
  url,
  videoFile,
  headers,
  (sent, total) => tracker.onProgress(sent, total)
);
```

## Error Handling

### Comprehensive Error Handling

```typescript
try {
  await streamingImages.upload(
    'https://api.example.com/images/upload',
    imageFile,
    headers,
    onProgress
  );
} catch (error) {
  if (error instanceof Error) {
    // Check error context
    const context = error.cause;
    
    if (error.message.includes('Invalid image payload')) {
      console.error('Validation failed:', error);
      alert('Please select a valid image file');
    } else if (error.message.includes('network')) {
      console.error('Network error:', error);
      alert('Upload failed. Please check your connection.');
    } else if (error.message.includes('timeout')) {
      console.error('Timeout:', error);
      alert('Upload timed out. Please try again.');
    } else {
      console.error('Unknown error:', error);
      alert('Upload failed. Please try again later.');
    }
  }
}
```

### Retry Failed Uploads

```typescript
async function uploadWithRetry(
  url: string,
  file: File,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}`);
      return await streamingImages.upload(url, file, {}, (sent, total) => {
        console.log(`Attempt ${attempt}: ${sent}/${total} bytes`);
      });
    } catch (error) {
      lastError = error as Error;
      console.error(`Attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  
  throw lastError!;
}

// Usage
try {
  const response = await uploadWithRetry('/api/upload', imageFile);
  console.log('Upload successful after retry');
} catch (error) {
  console.error('All retry attempts failed:', error);
}
```

## Cross-Platform Support

### Browser Environment

```typescript
// Works with File API
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (file) {
    await streamingImages.upload('/api/images', file, {}, (sent, total) => {
      console.log(`Progress: ${sent}/${total}`);
    });
  }
});
```

### Node.js Environment

```typescript
import { PassThrough } from 'stream';
import fs from 'fs';

// Works with Node.js streams
const fileStream = fs.createReadStream('./image.jpg');
const passThrough = new PassThrough();
fileStream.pipe(passThrough);

await streamingImages.upload(
  'https://api.example.com/images',
  passThrough,
  { 'Content-Type': 'image/jpeg' },
  (sent) => console.log(`Uploaded: ${sent} bytes`)
);
```

### Universal Implementation

```typescript
async function uploadFile(filePath: string | File) {
  if (typeof filePath === 'string') {
    // Node.js
    const fs = await import('fs');
    const { PassThrough } = await import('stream');
    const stream = fs.createReadStream(filePath);
    const passThrough = new PassThrough();
    stream.pipe(passThrough);
    return streamingImages.upload('/api/images', passThrough, {});
  } else {
    // Browser
    return streamingImages.upload('/api/images', filePath, {});
  }
}
```

## Best Practices

### 1. Validate Before Upload

```typescript
const validateImage = (file: File): boolean => {
  // Check file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('Invalid file type. Please upload JPEG, PNG, GIF, or WebP.');
    return false;
  }
  
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    alert('File too large. Maximum size is 10MB.');
    return false;
  }
  
  return true;
};
```

### 2. Show User-Friendly Progress

```typescript
const updateUI = (sent: number, total?: number) => {
  const progressBar = document.getElementById('progress-bar');
  const statusText = document.getElementById('status');
  
  if (total) {
    const percentage = (sent / total) * 100;
    progressBar.style.width = `${percentage}%`;
    statusText.textContent = `Uploading: ${percentage.toFixed(0)}%`;
  } else {
    statusText.textContent = `Uploading: ${formatBytes(sent)}`;
  }
};
```

### 3. Handle Network Interruptions

```typescript
const uploadWithResume = async (file: File) => {
  let offset = 0;
  
  while (offset < file.size) {
    try {
      const chunk = file.slice(offset, offset + 1024 * 1024); // 1MB chunks
      await streamingImages.upload(
        `/api/images/upload?offset=${offset}`,
        chunk,
        { 'Content-Range': `bytes ${offset}-${offset + chunk.size}/${file.size}` }
      );
      offset += chunk.size;
    } catch (error) {
      console.error('Chunk upload failed, retrying...', error);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};
```

### 4. Clean Up Resources

```typescript
const downloadAndDisplay = async (url: string) => {
  const response = await streamingImages.download(url, {});
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  
  // Use the URL
  document.getElementById('image').src = objectUrl;
  
  // Clean up when done
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 60000); // Revoke after 1 minute
};
```

## See Also

- [Advanced Features](./ADVANCED.md)
- [Configuration Guide](./CONFIGURATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [Examples](./EXAMPLES.md)
