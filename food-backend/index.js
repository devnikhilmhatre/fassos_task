var express = require('express')
var app = express()
var bodyParser = require('body-parser')
var socket = require('socket.io')
var http = require('http')
var mongoose = require('mongoose')
var routes = require('./routes')
var cors = require('cors')

// app.use(cors())

// const app = express()
const port = 3001

// mongoose.connect('mongodb://localhost:27017/food_exchange')
mongoose.connect('mongodb://nikhil:5445466nik@ds131814.mlab.com:31814/food-exchange')

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () { });



app.use(bodyParser.json());

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    // console.log('ji')
    // res.send('<div>123</div>')
    res.sendFile('./build/index.html', {root:__dirname})
})

const server = http.Server(app)
const webSocket = socket(server)
webSocket.origins('*:*')
webSocket.on('connection', (socket_instance) => {
    routes(socket_instance, app)
})

server.listen(port)

// module.export = app