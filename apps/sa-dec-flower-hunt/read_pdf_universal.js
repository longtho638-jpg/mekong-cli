const fs = require('fs');

async function tryRead() {
    const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');

    let pdfParse;

    try {
        console.log('Attempt 1: require("pdf-parse")');
        const lib = require('pdf-parse');
        if (typeof lib === 'function') pdfParse = lib;
        else if (lib.default && typeof lib.default === 'function') pdfParse = lib.default;
        else if (lib.PDFParse && typeof lib.PDFParse === 'function') pdfParse = lib.PDFParse; // Maybe it's a class?
        else {
            // Maybe it's the object itself and we need to verify keys
            console.log('Keys:', Object.keys(lib));
        }
    } catch (e) { console.log('Attempt 1 failed', e.message); }

    if (!pdfParse) {
        try {
            console.log('Attempt 2: require("pdf-parse/lib/pdf-parse.js")');
            const lib = require('pdf-parse/lib/pdf-parse.js');
            if (typeof lib === 'function') pdfParse = lib;
        } catch (e) { console.log('Attempt 2 failed', e.message); }
    }

    if (pdfParse) {
        console.log('Success: Found parse function');
        try {
            const data = await pdfParse(dataBuffer);
            console.log('\n--- TEXT CONTENT ---\n');
            console.log(data.text);
            console.log('\n--- END TEXT ---\n');
            // Write to file for safety
            fs.writeFileSync('extracted_pdf_content.txt', data.text);
        } catch (err) {
            console.error('Execution Error:', err);
        }
    } else {
        console.error('FATAL: Could not find pdf-parse function in any export');
    }
}

tryRead();
