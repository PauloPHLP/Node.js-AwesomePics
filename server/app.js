const express = require('express');
const hbs = require('express-handlebars');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const moment = require('moment');
const config = require('./config/config').get(process.env.NODE_ENV);
const {User} = require('./models/user');
const {Auth} = require('./middleware/auth');

const app = express();

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
app.use(bodyParser.json());
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/register', (req, res) => {
    if (res.user) 
        return res.redirect('/home');
    res.render('register');
})

app.post('/api/register', (req, res) => {
    const user = new User(req.body);

    user.save((err, doc) => {
        if (err)
            return res.status(400).send(err);

        user.generateToken((err, user) => {
            if (err)
                return res.status(400).send(err);
            
            res.cookie('auth', user.token).send('OK');
        })
    })
})

app.get('/login', (req, res) => {
    if (res.user) 
        return res.redirect('/home');
    res.render('login');
})

app.get('/myaccount', (req, res) => {
    if (res.user) 
        return res.redirect('/home');
    res.render('account');
})

app.listen(config.PORT, () => {
    console.log(`Awesome Pics running on port ${config.PORT}.`);
})