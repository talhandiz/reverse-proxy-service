require('dotenv').config();
const express = require('express');
const httpProxy = require('http-proxy');
const morgan = require('morgan');
const Handlebars = require('handlebars');

const app = express();
const proxy = httpProxy.createProxyServer({});

const targetUrlTemplate = process.env.TARGET_URL_TEMPLATE || 'https://{{headers.x-target-host}}{{request.url}}';
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
  timeout: 5000,
  proxyTimeout: 5000,
  changeOrigin: true
};
app.use((req, res) => {
  const template = Handlebars.compile(targetUrlTemplate);
  const targetUrl = template({
    headers: req.headers,

    //request kısmı olmadanda otomatik olarak hedef URL ye ekleniyor
    request: {
      url: req.url,
      method: req.method,
      body: req.body
    }
  });

  console.log(`Request URL: ${req.url}`);
  console.log(`Generated target URL: ${targetUrl}`);

  proxy.web(req, res, { ...proxyOptions, target: targetUrl }, (err) => {
    console.error('Proxy hatası:', err);
    res.status(500).json({ errorMessage: 'Proxy sunucusuna bağlanılamadı.' });
  });


});

proxy.on('error', (err, req, res) => {
  console.error('Proxy hatası:', err);
  res.status(500).json({ errorMessage: 'Hedef sunucuya bağlanılamadı.' });
});


app.listen(port, () => {
  console.log(`Proxy server ${port} portunda çalışıyor. Template URL: ${targetUrlTemplate}`);
});
