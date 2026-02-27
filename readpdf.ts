import fs from 'fs';
import pdf from 'pdf-parse';

let dataBuffer = fs.readFileSync('C:\\Users\\invio\\Downloads\\ficha de cadastro de cliente_.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(err => {
    console.error(err);
});
