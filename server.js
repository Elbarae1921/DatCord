const path = require('path');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const socketio = require('socket.io');
const favicon = require('express-favicon');
const {userJoin, userLeave, getCurrentUser, getRoomUsers, roomExists} = require('./utils/users');
const formatMessage = require('./utils/message');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

io.on('connection', socket => {

    socket.on('joinRoom', ({username, room}) => {

        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message', formatMessage('DatCord Bot', 'welcome to DatCord'));

        socket.broadcast.to(user.room).emit('message', formatMessage('DatCord Bot', `${user.username} has joined the chat`));
    
        io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
    });

    socket.on('chatMessage', msg => {
        const user = getCurrentUser(socket.id);

        socket.broadcast.emit('message', formatMessage(user.username, msg));
    });
    
    socket.on('disconnect', () => {
        const user = userLeave(socket.id);

        if(user) {

            io.to(user.room).emit('message', formatMessage('DatCord Bot', `${user.username} has left the chat`));

            io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
        }
    });
});

app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use('/roomExists', (req, res) => {
    const room = req.body.room || "";
    res.json({
        exists: roomExists(room)
    })
});

server.listen(5000, () => console.log('listening on 5000...'));