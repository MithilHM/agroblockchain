export class QRService {
  generateBatchUrl(batchId: string): string {
    return `http://localhost:3000/batch/${batchId}`;
  }

  async generateQRCode(batchId: string): Promise<string> {
    // TODO: Implement actual QR code generation
    const url = this.generateBatchUrl(batchId);
    return `QR_CODE_DATA_URL_FOR_${batchId}`;
  }
}

export const qrService = new QRService();