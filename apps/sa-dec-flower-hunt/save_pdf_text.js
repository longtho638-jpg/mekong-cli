const fs = require('fs');

async function save() {
    const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');
    const lib = require('pdf-parse');
    const PDFParse = lib.PDFParse || lib;

    try {
        const uint8 = new Uint8Array(dataBuffer);
        const parser = new PDFParse(uint8);
        const result = await parser.getText();

        if (result && result.text) {
            fs.writeFileSync('ANALYSIS_MASTER_PLAN.md', result.text);
            console.log('Saved to ANALYSIS_MASTER_PLAN.md');
        }
    } catch (e) {
        console.error('Error:', e);
    }
}

save();
