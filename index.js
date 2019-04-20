const express = require('express')
const app = express();
var formidable = require('formidable');
var fs = require('fs');
var http = require("http").Server(app);
var https = require('https');
var credentials = {
  key: fs.readFileSync('/var/www/facebox/ssl/my-key.pem'),
  cert: fs.readFileSync('/var/www/facebox/ssl/my-cert.pem')
};
var httpsServer = https.createServer(credentials, app);

var Datastore = require('nedb')
  , db = new Datastore({ filename: 'data.db', autoload: true, timestampData:true  });

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    //res.writeHead(200, {'Content-Type': 'text/html'});
    res.render('index.ejs', req);
});

app.post('/image-upload', (req, res) => {
  var form = new formidable.IncomingForm();
  console.log(form);
    form.parse(req, function (err, fields, files) {
      console.log(files[0]);
      var oldPath = files[0].filetoupload.path;
      var imageName =  Date.now() + '.jpg';
      var newPath = './public/images/' + imageName;
      fs.rename(oldPath, newPath, function (error) {
        if (error) res.send('error');
        var item = { image_name: imageName }
        db.insert(item);
        res.send('success');
      });
    });
});

app.get('/all', (req, res) => {
  var all = db.find({})
  .sort({ createdAt: -1 })      // OR `.sort({ updatedAt: -1 })` to sort by last modification time
  .exec(function(err, doc) {
    if(doc.length > 0) {

        console.log(doc);
        req.doc = doc;
        res.render('all.ejs', req);
    } else {
      res.send('Capture database is empty');
    }

  });
});

app.get('/latest', (req, res) => {
  var latest = db.find({})
  .sort({ createdAt: -1 })      // OR `.sort({ updatedAt: -1 })` to sort by last modification time
  .limit(1)
  .exec(function(err, latestDoc) {
    if(latestDoc.length > 0) {
        console.log(latestDoc);
        req.latestDoc = latestDoc;
        res.render('latest.ejs', req);
    } else {
      res.send('Capture database is empty');
    }

  });

});

http.listen(80, function(){
  console.log('listening on *:80');
});


httpsServer.listen(443, function(){
  console.log('listening on *:443');
});
