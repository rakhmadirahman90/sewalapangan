import imageCompression from 'browser-image-compression';

export async function compressImage(file: File, maxWidth = 1920, maxHeight = 1080, quality = 0.7): Promise<string> {
  const options = {
    maxSizeMB: 0.15, // High compression: 150KB limit per image for Firestore storage
    maxWidthOrHeight: Math.max(maxWidth, maxHeight),
    useWebWorker: true,
    initialQuality: quality,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(compressedFile);
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  } catch (error) {
    console.error('Compression error:', error);
    // Fallback to simple reader if compression fails
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
    });
  }
}
