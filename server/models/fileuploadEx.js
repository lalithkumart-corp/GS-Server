// GOOGLE : https://stackoverflow.com/questions/34590386/multer-create-new-folder-with-data

var express = require('express');
var multer = require('multer');
var bodyParser = require('body-parser');
var path = require('path');
var fs = require('fs');

var app = new express();
app.use(bodyParser.json());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    /* if you need to retain the original filename, then use filename and append to it date
     * if you don't need original filename but, just extension, then append extension at the
     * end of current timestamp. If you don't need extenion then just use Date.now() which
     */
    var filename = file.originalname;
    var fileExtension = filename.split(".")[1];

    cb(null, Date.now() + "." + fileExtension);
  }
})

var upload = multer({storage: storage});

//get upload form
app.get('/upload', function(req, res){
  res.render('upload');
});

//process upload
app.post('/upload', upload.single('file'),  function(req,res){
  res.status(204).end();
});

//lists all files in the uploads directory.
app.get('/listAllFiles', function(req, res) {
  var files = fs.readdirSync('./uploads');
  res.json(files);
});

//delete all files in the upload direcotry asynchronously
app.get('/deleteAllFiles', function(req, res) {
  fs.readdir('./uploads', function(err, items) {
    items.forEach(function(file) {
        fs.unlink('./uploads/' + file);
        console.log('Deleted ' + file);
    });
    res.status(204).end();
  });
});

//delets all file asynchronously except the most recent in which case the file
//with name being the latest timestamp is skipped.
app.get('/deleteAllExceptMostRecent', function(req, res) {
  console.log('/deleteAllFilesExceptMostRecent');
  fs.readdir('./uploads', function(err, items) {
    items.reverse();
    var flag = true;

    items.forEach(function(file) {
      if(flag) {
        flag = false;
      } else {
        fs.unlink('./uploads/' + file);
        console.log('Deleted ' + file);
      }
    });
  });
  res.status(204).end();
});

//delete all files of a direcotry in synchronous way
app.get('/deleteAllSync', function(req, res) {
  var filenames = fs.readdirSync('./uploads');

  filenames.forEach(function(file) {
    fs.unlinkSync('./uploads/' + file);
  });
});

//delete all files except most recent in synchronous way
app.get('/deleteAllSyncExceptMostRecent', function(req, res) {
  var filenames = fs.readdirSync('./uploads');
  filenames.reverse();
  var flag = true;
  filenames.forEach(function(file) {
    if(flag) 
      flag = false;
    else
      fs.unlinkSync('./uploads/' + file);
  });
});

var port = 3000;
app.listen( port, function(){ console.log('listening on port '+port); } );