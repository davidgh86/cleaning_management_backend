var ws = require('ws')
const EventEmitter = require('events')

const wsServer = new ws.Server({ noServer: true });

const eventEmitter = new EventEmitter()

function heartbeat() {
  this.isAlive = true;
}

wsServer.on('connection', function connection(ws) {
    ws.isAlive = true;
    ws.on('pong', heartbeat)
    eventEmitter.on('send_ws_message', function (text) {
        ws.send(text)
    })
});

const interval = setInterval(function ping() {
    wsServer.clients.forEach(function each(ws) {
        if (ws.isAlive === false) return ws.terminate();

        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

wsServer.on('close', function close() {
    clearInterval(interval);
});
  

wsServer.send = function (message) {
    eventEmitter.emit('send_ws_message', message)
}

module.exports = wsServer;