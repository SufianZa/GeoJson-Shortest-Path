let express = require('express');
let cookieParser = require('cookie-parser');
let logger = require('morgan');
var router = express.Router();
let mapRouter = require('./routes/map');
let vectorRouter = require('./routes/vector');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', mapRouter);
app.use('/maps', mapRouter);
app.use('/vector', vectorRouter);
app.use('/stylesheets/style.css', router.get('/' ));
app.use(express.static('public'));




module.exports = app;