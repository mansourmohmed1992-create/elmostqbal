const fetch = require('node-fetch');
(async () => {
  try {
    const res = await fetch('http://localhost:4000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@elmostaqbal-lab.com', password: 'admin123' })
    });
    console.log(await res.json());
  } catch (e) {
    console.error(e);
  }
})();