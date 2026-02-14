const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('/Users/macbookprom1/Documents/sa-dec-flower-hunt/Phân Tích Chuỗi Giá Trị Ngành Hoa Kiểng Việt Nam.pdf');

pdf(dataBuffer).then(function (data) {
    console.log(data.text);
}).catch(function (error) {
    console.error(error);
});
