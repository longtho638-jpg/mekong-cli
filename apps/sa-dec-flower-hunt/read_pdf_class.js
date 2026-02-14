const fs = require('fs');

async function tryRead() {
    const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');
    const lib = require('pdf-parse');

    // We know lib has PDFParse key and it is likely the class
    const PDFParse = lib.PDFParse || lib;

    try {
        console.log('Trying new PDFParse(dataBuffer)...');
        const instance = new PDFParse(dataBuffer);
        console.log('Instance created. Keys:', Object.keys(instance));

        // Sometimes usually it's a promise, but if it's a class, maybe it has .text?
        // Or maybe parsing happens in constructor?

        // Common pattern for older libs converted to classes:
        // maybe instance.parse()

        if (instance.text) {
            console.log('Found text directly!');
            console.log(instance.text.slice(0, 500));
        } else if (typeof instance.then === 'function') {
            console.log('Instance is a promise!');
            const data = await instance;
            console.log(data.text.slice(0, 500));
        } else {
            console.log('Inspecting prototype...');
            console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
        }

    } catch (e) {
        console.log('Constructor failed:', e.message);
        // Fallback: maybe it has a static method?
        if (PDFParse.process) {
            console.log('Trying static process...');
        }
    }
}

tryRead();
