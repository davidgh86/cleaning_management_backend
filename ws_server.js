var ws = require('ws')
const EventEmitter = require('events')

const wsServer = new ws.Server({ noServer: true });

const eventEmitter = new EventEmitter()

wsServer.on('connection', function connection(ws) {
    eventEmitter.on('send_ws_message', function (text) {
        ws.send(text)
    })
});

wsServer.send = function (message) {
    eventEmitter.emit('send_ws_message', message)
}

module.exports = wsServer;