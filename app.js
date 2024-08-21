require('dotenv').config();
const express = require('express');
const httpProxy = require('http-proxy');
const morgan = require('morgan');
const exphbs = require('express-handlebars'); 

const app = express();
const proxy = httpProxy.createProxyServer({});

const targetUrl = process.env.TARGET_URL || 'http://localhost:3000';
const port = process.env.PORT || 8000;

app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(morgan('combined'));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

app.use((req, res) => {
  proxy.web(req, res, { target: targetUrl }, (err) => {
    if (err) {
      console.error('Proxy hatası:', err);
      res.status(500).render('error', { errorMessage: 'Proxy sunucusuna bağlanılamadı.' });
    }
  });
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy hatası:', err);
  res.status(500).render('error', { errorMessage: 'Hedef sunucuya bağlanılamadı.' });
});

app.listen(port, () => {
  console.log(`Proxy server ${port} portunda çalışıyor. Hedef URL: ${targetUrl}`);
});
