export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('海报生成失败'));
      }
    }, 'image/png');
  });
}

export function posterFileName(date: string): string {
  return `羽毛球分组_${date || '未命名'}.png`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function isWeChatBrowser(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

export function canSharePoster(blob: Blob, date: string): boolean {
  if (typeof navigator === 'undefined' || typeof File === 'undefined') {
    return false;
  }
  if (!navigator.canShare || !navigator.share) return false;

  const file = new File([blob], posterFileName(date), { type: 'image/png' });
  try {
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}

export async function sharePoster(blob: Blob, date: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof File === 'undefined') {
    return false;
  }
  if (!navigator.share) return false;

  const file = new File([blob], posterFileName(date), { type: 'image/png' });

  try {
    await navigator.share({
      files: [file],
      title: '羽毛球分组',
      text: '羽毛球分组海报',
    });
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return false;
    }
    return false;
  }
}
