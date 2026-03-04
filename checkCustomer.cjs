const fs = require('fs');
const data = JSON.parse(fs.readFileSync('server/data.json','utf-8'));
console.log(data.customers.find(c=>c.id==='customer_1772551951349'));
