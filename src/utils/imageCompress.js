// src/utils/imageCompress.js
//
// Compresses an image file down to a small base64 JPEG entirely client-side,
// so receipt photos can be stored directly as a field on the transaction
// Firestore document instead of needing Firebase Storage (which requires
// the paid Blaze plan). Firestore documents cap out at 1 MiB, so this keeps
// receipts comfortably under that — a resized, compressed receipt photo is
// typically 30–150 KB as base64.

const MAX_DIMENSION = 900; // px, longest side
const JPEG_QUALITY   = 0.6;

/**
 * @param {File} file - image file from an <input type="file">
 * @returns {Promise<string>} base64 data URL (e.g. "data:image/jpeg;base64,...")
 */
export const compressImageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Hindi ito isang larawan.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Hindi mabuksan ang larawan.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Sira ang larawan.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width  = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width  = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        const canvas = document.createElement('canvas');
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};
