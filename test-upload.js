const http = require('http');
const fs = require('fs');

fs.writeFileSync('test.txt', 'hello world test file\r\n');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const head = '--' + boundary + '\r\n' +
             'Content-Disposition: form-data; name="duration"\r\n\r\n' +
             '15\r\n' +
             '--' + boundary + '\r\n' +
             'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n' +
             'Content-Type: text/plain\r\n\r\n';
const tail = '\r\n--' + boundary + '--\r\n';

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary
  }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', data));
});

req.write(head);
const rs = fs.createReadStream('test.txt');
rs.pipe(req, { end: false });
rs.on('end', () => {
    req.write(tail);
    req.end();
});
