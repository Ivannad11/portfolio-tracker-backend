const http = require('http');
const https = require('https');
const url = require('url');

http.createServer((req, res) => {
    const proxyUrl = 'https://invest-api.tinkoff.ru' + req.url;
    const parsedUrl = url.parse(proxyUrl);

    const options = {
        hostname: parsedUrl.hostname,
        path: parsedUrl.path,
        method: req.method,
        headers: {
            ...req.headers,
            'Host': parsedUrl.hostname,
            'Access-Control-Allow-Origin': '*'
        }
    };

    const proxyReq = https.request(options, (proxyRes) => {
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        res.writeHead(502);
        res.end('Bad Gateway');
    });

    req.pipe(proxyReq);
}).listen(8000, () => console.log('Proxy на http://localhost:8000'));
