const fs = require('fs');

async function read() {
    const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');
    const lib = require('pdf-parse');
    const PDFParse = lib.PDFParse || lib;

    try {
        const uint8 = new Uint8Array(dataBuffer);
        const parser = new PDFParse(uint8);
        console.log('Calling getText()...');
        const text = await parser.getText();

        if (text) {
            console.log('\n--- EXTRACTED TEXT ---\n');
            console.log(text.slice(0, 5000)); // Print first 5000 chars
            fs.writeFileSync('final_extracted_content.txt', text);
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

read();
