'use strict';

const express = require('express');

// Constants
const PORT = process.env.PORT || 3000;;
const HOST = '0.0.0.0';

let Parser = require('rss-parser');
let parser = new Parser({
        headers: {'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.54 Mobile Safari/537.36 Edg/101.0.1210.39:'},
      });

// App
const app = express();
app.use(require('body-parser').urlencoded({ extended: false }));

app.post('/rss', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  console.log('Recebendo requisição', req.body);
  let feed = null;
  try {
    feed = await parser.parseURL(req.body.url);
    
  }
  catch (e) {
    console.log('Erro ao ler feed', e);
  }  
  req.body; // { url: 'https://www.tse.jus.br/rss' }
  if(feed){
    res.json(feed);
  }else{
    res.sendStatus(404);
  }
});

app.get('/', (req, res) => {
  res.send("GET Request Called")
})

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);