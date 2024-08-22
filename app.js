require('dotenv').config();
const express = require('express');
const httpProxy = require('http-proxy');
const morgan = require('morgan');

const app = express();
const proxy = httpProxy.createProxyServer({});

const targetUrl = process.env.TARGET_URL || 'http://localhost:5984';
const port = process.env.PORT || 8000;

app.use(morgan('combined'));

// CORS ayarları ve preflight request'leri işleme
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200); // OPTIONS request'leri burada sonlandır
  }
  next();
});

const proxyOptions = {
  target: targetUrl,
  timeout: 5000,
  proxyTimeout: 5000,
  changeOrigin: true
};

app.use((req, res) => {
  proxy.web(req, res, proxyOptions, (err) => {
    console.error('Proxy hatası:', err);
    res.status(500).json({ errorMessage: 'Proxy sunucusuna bağlanılamadı.' });
  });
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy hatası:', err);
  res.status(500).json({ errorMessage: 'Hedef sunucuya bağlanılamadı.' });
});

app.listen(port, () => {
  console.log(`Proxy server ${port} portunda çalışıyor. Hedef URL: ${targetUrl}`);
});
