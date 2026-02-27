import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// @ts-ignore
import PDFParser from 'pdf2json';

export async function extractTextFromBase64(pdfBase64: string): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const buffer = Buffer.from(pdfBase64, 'base64');
            const tempId = crypto.randomUUID();
            const tempPath = path.join(process.cwd(), `temp_${tempId}.pdf`);

            fs.writeFileSync(tempPath, buffer);

            const pdfParser = new PDFParser(null as any, true as any);

            pdfParser.on('pdfParser_dataError', (errData: any) => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                reject(errData.parserError);
            });

            pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
                const text = pdfParser.getRawTextContent();
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
                resolve(text);
            });

            pdfParser.loadPDF(tempPath);
        } catch (e) {
            reject(e);
        }
    });
}
