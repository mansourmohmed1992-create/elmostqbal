var fetch = globalThis.fetch || require('node-fetch');

(async ()=>{
  try {
    const res = await fetch('http://localhost:4000/api/admin/customers/customer_1772551951349',{
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({fullName:'Test',phone:'01023764469',age:30,address:'Test',password:'abc123'})
    });
    const data = await res.json();
    console.log('status',res.status,data);
  } catch(err) {
    console.error(err);
  }
})();