var Nexmo = require('nexmo');
var nexmo = new Nexmo({
    apiKey: '4e823dde',
    apiSecret: 'jnY8dF3JAThmkgn5'
});
var dist = 0;
var nodemailer = require('nodemailer');
var http = require('http').Server();
var client = require('socket.io').listen(8080).sockets;
var User = require('./model/users');
var Message = require('./model/data');
var multer = require('multer');
var fs = require('fs');
const LocalStrategy = require('passport-local').Strategy;
const passport = require('passport');
var session = require('express-session');
var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'christinmobileapp@gmail.com',
        pass: 'christ-inapp'
    }
});
var bins = [
    {bin: 'A', label: 'Police station', location: 'King\'ong\'o'},
    {bin: 'B', label: 'Cafteria', location: 'Dedan Kimathi'}]
var storage =   multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, './public/uploads');
    },
    filename: function (req, file, callback) {
        var extArray = file.mimetype.split("/");
        var extension = extArray[1];
        callback(null, file.fieldname + '_'+Date.now()+'.'+extension);
    }

});
var sessionChecker = (req, res, next) => {
    if (req.session.user) {
        if(req.session.user.username == 'admin'){
         User.find({'role': 'Worker'}, {username: 1, _id: 0}, function(err, workers){
            if(err)
                throw err;
            else{
                workers = workers.map(a => a.username);
                res.render('home',{user: req.session.user, workers: workers, bins: bins});
            }
         })
        }else{
             Message.find({worker: req.session.user.username}, function(err,rows){
                  if(err)
                    throw err;
                  else
                     res.render('home',{user: req.session.user, rows: rows});
             } ).sort({$natural: -1});
        }
    } else {
        next();
    }    
};

module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());
    app.post('/', function (req, res) {
        console.log()
        client.emit('sensor',  req.body);
        var perc = Math.ceil(200/req.body.dis);
        if(perc > 90)
        {
          var index = bins.findIndex(q =>q.bin == req.body.sens);
           nexmo.message.sendSms('8801779090677', '254729532087',
                      'The bin at '+bins[index].location+' with the label '+bins[index].label+' needs to be cleared.',
                      function(err, responseData) {
                          if(err)
                              console.log(err);
                        }
                  );
        }
        res.send();
    });
        app.use(session({
        key: 'user_sid',
        secret: 'somerandonstuffs',
        resave: false,
        saveUninitialized: false,
        cookie: {
            expires: 60000000
        }
   }));
    app.post('/home', function(req, res){
        res.render('home',{});
    })
    app.get('/end', function(req, res){
        req.session.destroy();
        res.redirect('/');
    })
    app.get('/',sessionChecker, function(req, res){
     var passedVariable = req.query.valid;
     var err;
      if(passedVariable)
         err = req.query.valid;
          res.render('index',{
            err: err
        })
     
    })
    app.get('/error', function(req, res){
        var string = encodeURIComponent('Please check your credentials and try again!');
      res.redirect("/?valid=" + string);
    });

    passport.serializeUser(function(user, cb) {
      cb(null, user.id);
    });

    passport.deserializeUser(function(id, cb) {
      User.findById(id, function(err, user) {
        cb(err, user);
      });
    });

    passport.use(new LocalStrategy(
      function(username, password, done) {
          User.findOne({
            username: username
          }, function(err, user) {
            if (err) {
              return done(err);
            }

            if (!user) {
              return done(null, false);
            }
            if (!user.validPassword(password)) {
              return done(null, false);
            }
            return done(null, user);
          });
      }
    ));

    app.post('/index',
      passport.authenticate('local', { failureRedirect: '/error' }),
      function(req, res) {
        req.session.user = req.user;
        res.redirect('/');
      });

    client.on('connection', function (socket) {
      socket.on('signup', function(data){
          User.findOne({'username': data.username},function(err, res){
            if(err)
                throw err;
            else{
                var message;
                if (res){
                    message = ['Sorry, the username is already registered'];
                }else{
                    var newUser = new User();
                    newUser.username = data.username;
                    newUser.email = data.email;
                    newUser.phone = data.phone;
                    newUser.password = newUser.generatHarsh(data.password);
                    newUser.role = data.role;
                    newUser.location = data.location;
                    message = ['success', newUser];
                    newUser.save(function(err){
                        if(err)
                             throw err;
                    })
                }
                socket.emit('signup', {message: message});
            } 
          })
      });
      socket.on('msgsent', function(data){
         data.worker = data.worker.toString();
         var newMessage = new Message();
         newMessage.message = data.msg;
         newMessage.bin = data.bin;
         newMessage.worker = data.worker;
         newMessage.date = data.date;
         newMessage.time = data.time;
         newMessage.collectBin = bins[bins.findIndex(q =>q.bin == data.bin)];
         newMessage.weightCollected = data.weight.replace('%', 'kg');
         newMessage.save(function(err){
            if(err)
                throw err;
         });
         User.findOne({username: data.worker},{email: 1, _id: 0}, function(err, user){
            if(err)
                throw err;
            else{
                var mailOptions = {
                    from: 'Waste management organization.',
                    to: user.email,
                    subject: 'Assignment to waste collection notification✔',
                    html: 'Hi '+data.worker+'<br/><br/>You are hereby notified that you have been assigned to some tasks in<br/> relation to waste collection. <br/>Please login into your account to view your assignment location and any other information.<br/><br/><strong>Thank you<br/><br/>Management</strong>'
                };
                transporter.sendMail(mailOptions, function (error) {
                    if (error) {
                        console.log(error);
                    }
                });
            }

         })
      });
      socket.on('getData', function(data){
        Message.find({'collectBin.bin':data.tin},{_id:0}, function(err, msgs){
           if(err)
            throw err;
        else{
            socket.emit('binData', msgs);
        }
        }).sort({$natural: -1});
      })
    })
};

