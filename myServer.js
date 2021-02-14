const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
//const mysql = require('mysql');
const sqlite3 = require('sqlite3').verbose();
const port = process.argv[2] || 8081;
var qs = require('querystring');

http.createServer(function (req, res) {
  if(req.method === "GET") {
  console.log(`${req.method} ${req.url}`);

  // parse URL
  const parsedUrl = url.parse(req.url);
	if(parsedUrl.pathname == `/`) parsedUrl.pathname = `/index.html`;
  console.log(`parsedUrl: ${parsedUrl.pathname}`);
  // extract URL path
  let pathname = `.${parsedUrl.pathname}`;
  console.log(`parsedname: ${pathname}`);
  // based on the URL path, extract the file extention. e.g. .js, .doc, ...
  const ext = path.parse(pathname).ext;
  // maps file extention to MIME typere
  const map = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword'
  };

  fs.exists(pathname, function (exist) {
    if(!exist) {
      // if the file is not found, return 404
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    // if is a directory search for index file matching the extention
    if (fs.statSync(pathname).isDirectory()) pathname += '/index' + ext;

    // read file from file system
    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        // if the file is found, set Content-type and send data
        res.setHeader('Content-type', map[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });
  } else if(req.method === "POST") {
    if (req.url === "/submitIdea") {
      var requestBody = '';
      req.on('data', function(data) {
        requestBody += data;
        if(requestBody.length > 1e7) {
          res.writeHead(413, 'Request Entity Too Large', {'Content-Type': 'text/html'});
          res.end('<!doctype html><html><head><title>413</title></head><body>413: Request Entity Too Large</body></html>');
        }
      });
      req.on('end', function() {
        var formData = qs.parse(requestBody);
        console.log(`formData ${formData.ideaText}`);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<!doctype html><html><head><title>response</title></head><body>');
        res.write('Thanks for your Idea<br />'+formData.nameText);
        res.write('<br />Description: '+formData.ideaText);
        res.write('<br />Categories: '+formData.categoriesText);
        res.write('<br />Skills: '+formData.skillsText);
        res.end('</body></html>');

        let db = new sqlite3.Database('./db/Ideas.db', (err) => {
          if (err) {
            return console.error(err.message);
          }
          console.log('Connected to the SQlite database.');
        });
        //Write to Database (use in POST answer to save data)
        db.run('INSERT INTO Idea(title,description) VALUES(?1,?2)', {
            1: formData.nameText,
            2: formData.ideaText
          }, function(err){
            if (err) {
              return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
          });
        db.close();
      });
    } else {
      res.writeHead(404, 'Resource Not Found', {'Content-Type': 'text/html'});
      res.end('<!doctype html><html><head><title>404</title></head><body>404: Resource Not Found</body></html>');
    }
  } else {
    res.writeHead(405, 'Method Not Supported', {'Content-Type': 'text/html'});
    return res.end('<!doctype html><html><head><title>405</title></head><body>405: Method Not Supported</body></html>');
  }
}).listen(parseInt(port));
console.log(`Server listening on port ${port}`);