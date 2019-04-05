const express = require('express');
const hbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const config = require('./config/config').get(process.env.NODE_ENV);
const {User} = require('./models/user');
const {Post} = require('./models/post');
const {Auth} = require('./middleware/auth');

const app = express();
let imageName = '';
let date = '';

mongoose.Promise = global.Promise;
mongoose.connect(config.DATABASE, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + './../views/layouts',
    partialsDir: __dirname + './../views/partials'
}));
app.set('view engine', 'hbs');
app.use('/css', express.static(__dirname + './../public/css'));
app.use('/js', express.static(__dirname + './../public/js'));
app.use('/img', express.static(__dirname + './../img'));
app.use('/icons', express.static(__dirname + './../public/icons'));
app.use('/uploads', express.static(__dirname + './../uploads'));
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', Auth, (req, res) => {
    if (!req.user) { 
        Post.find().sort({date: 'desc'}).exec((err, doc) => {
            if (err)
                return res.status(400).send(err);
            res.render('home', {
                logged: false,
                posts: doc
            })
        })
    } else {
        User.find({'_id': req.user._id}).exec((err, user) => {
            Post.find().sort({date: 'desc'}).exec((err, doc) => {
                if (err)
                    return res.status(400).send(err);
                res.render('home', {
                    logged: true,
                    user,
                    posts: doc
                })
            })
        })
    }
})

app.get('/register', Auth, (req, res) => {
    if (req.user) 
        return res.redirect('/');
    res.render('register');
})

app.post('/api/register', (req, res) => {
    const user = new User(req.body);
    
    user.save((err, doc) => {
        if(err) 
            return res.status(400).send(err);
        user.generateToken((err, user) => {
            if(err) 
                return res.status(400).send(err);
            res.cookie('auth', user.token).send('OK!');
        })
    })
})

app.get('/login', Auth, (req, res) => {
    if (req.user) 
        return res.redirect('/');
    res.render('login');
})

app.post('/api/login', (req, res) => {
    User.findOne({'email': req.body.email}, (err, user) => {
        if(!user) 
            return res.status(400).json({message: 'Wrong email.'});
   
        user.comparePassword(req.body.password, function(err, isMatch) {
            if(err) 
                throw err;
            if(!isMatch) 
                return res.status(400).json({message: 'Wrong password.'});

            user.generateToken((err, user) => {
                if(err) 
                    return res.status(400).send(err);
                res.cookie('auth', user.token).send('OK!');
            })
        })
    })
})

app.get('/logout', Auth, (req, res) => {
    req.user.deleteToken(req.token, (err, user) => {
        if(err) 
            return res.status(400).send(err);
        res.redirect('/')
    })
})

app.get('/shareapic', Auth, (req, res) => {
    if (!req.user) { 
        return res.render('login', {
            logged: false
        });
    }
    User.find({'_id': req.user._id}).exec((err, user) => {
        res.render('shareapic', {
            logged: true,
            userName: req.user.name
        })
    })
})

app.post('/api/shareapic', (req, res) => {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            cb (null, 'uploads/')
        },
        filename: (req, file, cb) => {
            date = Date.now();
            imageName = date + "_" + file.originalname;
            cb (null, `${imageName}`);
        }
    })
    
    const upload = multer({
        storage
    }).single('image');

    upload(req, res, function(err) {
        const post = new Post({
            title: req.body.title,
            text: req.body.text,
            imageName: imageName,
            date: date
        });

        post.save((err, doc) => {
            if (err)
                res.status(400).send(err);
        })

        if (err)
            return res.end('Invalid file format.');
        res.end('Image uploaded successfully!');
    })
})

app.listen(config.PORT, () => {
    console.log(`Awesome pics running on port ${config.PORT}`);
})