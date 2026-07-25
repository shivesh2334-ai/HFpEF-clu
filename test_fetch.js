const http = require('http');
const server = http.createServer((req, res) => {
  res.end(JSON.stringify(req.headers));
});
server.listen(0, async () => {
  const port = server.address().port;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, {
      headers: { 'Authorization': 'B e a r e r 123\n' }
    });
    console.log(await res.text());
  } catch (e) {
    console.error("Error:", e.message);
  }
  server.close();
});
