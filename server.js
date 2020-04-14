// import modules
const path = require('path'); // for path operations
const http = require('http'); // to create a server for the socket
const express = require('express'); // web framework
const bodyParser = require('body-parser'); // parse the request params in a body (req.body)
const socketio = require('socket.io'); // socket module
const favicon = require('express-favicon'); // to set the website's icon
const {userJoin, userLeave, getCurrentUser, getRoomUsers, roomExists} = require('./utils/users'); // user functions (seperated from the main file for less headache)
const formatMessage = require('./utils/message');

//initialize the app using express
const app = express();
const server = http.createServer(app); //creating a server using the http module (since express() doesn't return a server anymore but a function, which wouldn't work with socket.io)
const io = socketio(server); //initialize the socket to work on the current server

//on the socket connection
io.on('connection', socket => {
    
    // when the current socket sends a joinRoom to join a room
    socket.on('joinRoom', ({username, room}) => {

        // add the user to the user's list in /utils/users.js
        const user = userJoin(socket.id, username, room);

        // send back the user id (which is just the socket id) back to the socket/user
        socket.emit('userId', user.id);

        // add the socket to the requested room
        socket.join(user.room);

        // then send a welcome message
        socket.emit('message', formatMessage('DatCord Bot', 'DatCord Bot', 'welcome to DatCord'));

        // and notify the other users in the same room that a user has joined
        socket.broadcast.to(user.room).emit('message', formatMessage('DatCord Bot', 'DatCord Bot', `${user.username} has joined the chat`));
    
        // finally send back the room id and the current online users to all the users in the room
        io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
    });

    // when a new message is sent to a room
    socket.on('chatMessage', msg => {
        // fetch which user sent the message
        const user = getCurrentUser(socket.id);

        // send the message back to all the users in the room
        io.to(user.room).emit('message', formatMessage(user.id, user.username, msg));
    });

    // when a user is typing
    socket.on('typing', () => {
        // get which user send the message
        const user = getCurrentUser(socket.id);

        // broadcast to all the users in the room except the current user (which is typing) that a user is typing
        socket.broadcast.emit('typing', user.username);
    })
    
    // when a user leaves
    socket.on('disconnect', () => {
        // get which user left
        const user = userLeave(socket.id);

        if(user) { // if the function returned a valid user object

            // tell all the users that a user left the room
            io.to(user.room).emit('message', formatMessage('DatCord Bot', 'DatCord Bot', `${user.username} has left the chat`));

            // send the new current users list to the room users
            io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
        }
    });
});

// ==> Back to the server

// parse all the request parameters into a body (req.body)
app.use(bodyParser.urlencoded({extended: false}));

// server the public folder (in order to access all the files inside it as if they were in the root folder)
app.use(express.static(path.join(__dirname, 'public')));

// set the website's favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// POST ==> /roomExists params: {room: "the room id"}
app.post('/roomExists', (req, res) => {
    const room = req.body.room || ""; // get the room id sent with the request
    res.json({
        exists: roomExists(room) //send back true if the room exists, false otherwise
    })
});

// start the server which contains both the express app and the socket on port 5000
server.listen(5000, () => console.log('listening on 5000...'));