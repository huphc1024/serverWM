const cors = require('cors');
let express = require('express');
//setup express app 
const request = require('request');
let app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var authenTrue = true;
var av = 'Y7pQA7fck123';
let http = require('https');
const productRouter = require('./router.product');
const mongoose = require('mongoose'),
    config = require('./config/DB');

var whitelist = ['http://localhost:4200', 'http://localhost'];
var corsOptions = {
    origin: function (origin, callback) {
        // if (!origin || whitelist.indexOf(origin) !== -1) {
        //     callback(null, true)
        // } else {
        //     callback(new Error('Not allowed by CORS'))
        // }
        callback(null, true)
    }
}
app.use(cors(corsOptions));
//basic route for homepage
app.get('/', (req, res) => {
    res.json('welcome to express app');
});
function basicAuth(e, o, s) { return e.path && "/authen" == e.path ? s() : authenTrue ? s() : o.status(400).json({ msg: "Không được phép sử dụng" }) };
app.post("/authen", (e, o) => { if (console.log("authen"), authenTrue) o.status(200).json("welcome to express app"); else { let s = e.body.pass; console.log(s), s == av ? (authenTrue = !0, o.status(200).json("welcome to express app")) : o.status(400).json({ msg: "Không được phép sử dụng" }) } });
app.use(basicAuth);
app.use('/product', productRouter);
mongoose.Promise = global.Promise;
mongoose.connect(config.DB, { useNewUrlParser: true }).then(
    () => { console.log('Database is connected'); },
    err => { console.log('Cannot connect to the database' + err) }
);

//server listens to port 8082
const server = app.listen(4040, (err) => {
    if (err)
        throw err;
    console.log('listening on port 8082');
});

var CronJob = require('cron').CronJob;
const syncAllData = require('./service/cronjob_sync');
var job = new CronJob('0 0 0,4,18,22 * * *', function () {
    syncAllData();
}, null, true, 'America/Los_Angeles');
job.start();

