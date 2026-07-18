import { getCertificatePDF } from '@/actions/certificates.actions';

function printPdfBlob(blob: Blob, filename?: string): Promise<void> {
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = url;

    let printTimer: ReturnType<typeof setTimeout> | undefined;
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;

    const cleanup = () => {
      if (settled) return;
      settled = true;
      if (printTimer) clearTimeout(printTimer);
      if (cleanupTimer) clearTimeout(cleanupTimer);
      URL.revokeObjectURL(url);
      iframe.remove();
    };

    iframe.onload = () => {
      try {
        try {
          iframe.contentDocument!.title = filename || 'document.pdf';
        } catch {
          // Cross-origin iframe — title assignment is best-effort
        }
        printTimer = setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          cleanupTimer = setTimeout(() => {
            cleanup();
            resolve();
          }, 10000);
        }, 0);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    iframe.onerror = () => {
      cleanup();
      reject(new Error('Failed to load the PDF into the iframe.'));
    };

    document.body.appendChild(iframe);
  });
}

export async function printCertificate(id: number) {
  const { blob, filename } = await getCertificatePDF(id);
  await printPdfBlob(blob, filename);
}
