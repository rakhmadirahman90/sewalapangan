import imageCompression from 'browser-image-compression';

function convertToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export async function compressImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.6): Promise<string> {
  const options = {
    maxSizeMB: 0.1, // 100KB limit
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
    initialQuality: quality,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return await convertToBase64(compressedFile);
  } catch (error) {
    console.warn('Compression with web worker failed, retrying without worker:', error);
    try {
      options.useWebWorker = false;
      const compressedFile2 = await imageCompression(file, options);
      return await convertToBase64(compressedFile2);
    } catch (fallbackError) {
      console.error('Compression totally failed:', fallbackError);
      if (file.size > 500 * 1024) {
        throw new Error('File terlalu besar dan kompresi gagal. Silakan gunakan file yang lebih kecil.');
      }
      return await convertToBase64(file);
    }
  }
}

