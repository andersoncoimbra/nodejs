'use strict';

const express = require('express');

// Constants
const PORT = process.env.PORT || 3000;;
const HOST = '0.0.0.0';

let Parser = require('rss-parser');
let parser = new Parser({
        headers: {
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64; rv:35.0) Gecko/20100101 Firefox/35.0.1",
        },
      });

// App
const app = express();
app.use(require('body-parser').urlencoded({ extended: false }));

app.post('/rss', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  console.log('Recebendo requisição', req.body);

    let feed = await parser.parseURL(req.body.url);
    res.send(feed);

    if(feed){
        res.send(feed);
    }else{
        res.sendStatus(404);
    }
  
  
  req.body; // { url: 'https://www.tse.jus.br/rss' }

});


app.get('/', (req, res) => {
    res.send('status: ' + res.statusCode); // status: 200
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);
