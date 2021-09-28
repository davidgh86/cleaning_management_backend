const app = require('./rest_server');
const ws = require('./ws_server')

// you explicitly create the http server
const server = require('http').createServer(app);
  
server.listen(3000);

server.on('upgrade', (request, socket, head) => {
    ws.handleUpgrade(request, socket, head, socket => {
        ws.emit('connection', socket, request);
    });
});

module.exports = server;