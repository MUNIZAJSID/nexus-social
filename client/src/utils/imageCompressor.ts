/**
 * Utilitário de compressão de imagens no cliente antes do upload
 * Reduz fotos de câmeras de celular (10MB-20MB) para ~300KB com qualidade impecável
 */
export async function compressImage(file: File, maxWidth = 1920, quality = 0.82): Promise<File> {
  // Se não for imagem ou for GIF animado, não mexe
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }

  // Se já for pequena (< 400KB), não precisa comprimir
  if (file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(file);
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Gera blob comprimido em WebP ou JPEG
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Se por algum motivo ficou maior, usa o original
              return resolve(file);
            }
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, outputType === 'image/jpeg' ? '.jpg' : '.png'), {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
