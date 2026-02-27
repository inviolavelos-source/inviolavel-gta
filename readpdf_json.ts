import fs from 'fs';
import PDFParser from 'pdf2json';

const pdfParser = new PDFParser(this, 1);

pdfParser.on('pdfParser_dataError', errData => console.error(errData.parserError));
pdfParser.on('pdfParser_dataReady', pdfData => {
    fs.writeFileSync('./pdf_text.txt', pdfParser.getRawTextContent());
    console.log("PDF text extracted to pdf_text.txt");
});

pdfParser.loadPDF('C:\\Users\\invio\\Downloads\\ficha de cadastro de cliente_.pdf');
