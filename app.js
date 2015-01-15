console.log("let's rock")

var express = require('express');
var http = require('http');
var path = require('path');
var aws = require('aws-sdk');
var mongo = require('mongojs')('pickeez');
var photos = mongo.collection('photos');
var bodyParser = require('body-parser')

var app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//Setup and globals
app.set('views', __dirname + '/views');
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));

var AWS_ACCESS_KEY = process.env.S3_KEY;
var AWS_SECRET_KEY = process.env.S3_SECRET;
var S3_BUCKET = process.env.S3_BUCKET

lg = log = function(err,data) { console.log(err || data); }

app.get('/account', function(req, res){
    app.user = req.query.user = req.query.user || 'default_user';
    
    photos.find({user: app.user}, function(err,data){
        res.render('account',  {
            user: app.user,
            photos: data
        });
    });    
});

app.post('/addPicToUser', function(req,res){
    photos.insert({user: app.user, url: req.body.url},function(err,data) {
        res.json({msg: "ok"});
    });
});

/*
 * Respond to GET requests to /sign_s3.
 * Upon request, return JSON containing the temporarily-signed S3 request and the
 * anticipated URL of the image.
 */
app.get('/sign_s3', function(req, res){
    aws.config.update({accessKeyId: AWS_ACCESS_KEY , secretAccessKey: AWS_SECRET_KEY });
    var s3 = new aws.S3(); 
    req.query.s3_object_name = app.user+Math.random().toString();

    var s3_params = { 
        Bucket: S3_BUCKET, 
        Key: req.query.s3_object_name, 
        Expires: 60, 
        ContentType: req.query.s3_object_type, 
        ACL: 'public-read'
    }; 

    s3.getSignedUrl('putObject', s3_params, function(err, data){ 
        if(err){ 
            console.log(err); 
        }
        else{ 
            var return_data = {
                signed_request: data,
                url: 'https://'+S3_BUCKET+'.s3.amazonaws.com/'+req.query.s3_object_name 
            };
            res.write(JSON.stringify(return_data));
            res.end();
        } 
    });
});

/*
 * Respond to POST requests to /submit_form.
 * This function needs to be completed to handle the information in 
 * a way that suits your application.
 */
// app.post('/submit_form', function(req, res){
//     username = req.body.username;
//     full_name = req.body.full_name;
//     avatar_url = req.body.avatar_url;
//     update_account(username, full_name, avatar_url); // TODO: create this function
//     // TODO: Return something useful or redirect
// });

/*
 * Start the server to handle incoming requests.
 */
app.listen(app.get('port'));