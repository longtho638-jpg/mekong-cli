const fs = require('fs');

async function read() {
    const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');
    const lib = require('pdf-parse');
    const PDFParse = lib.PDFParse || lib;

    try {
        const parser = new PDFParse(dataBuffer);
        // Try getText first as it's the most obvious
        console.log('Calling getText()...');
        const text = await parser.getText();

        if (text) {
            console.log('\n--- EXTRACTED TEXT ---\n');
            console.log(text.slice(0, 2000)); // Print first 2000 chars
            fs.writeFileSync('final_extracted_content.txt', text);
        } else {
            console.log('getText() returned empty. Trying .load() then .getText()?');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

read();
