import QRCode from 'qrcode';

export async function generateQrCode(text: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    QRCode.toFile(filePath, text, { type: 'png' }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}
