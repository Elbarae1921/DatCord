// import modules
const path = require('path'); // for path operations
const http = require('http'); // to create a server for the socket
const express = require('express'); // web framework
const bodyParser = require('body-parser'); // parse the request params in a body (req.body)
const socketio = require('socket.io'); // socket module
const favicon = require('express-favicon'); // to set the website's icon
const {userJoin, userLeave, getCurrentUser, getRoomUsers, roomExists, getUserByUsername} = require('./utils/users'); // user functions (seperated from the main file for less headache)
const formatMessage = require('./utils/message');

//initialize the app using express
const app = express();
// set the views folder and templating engine
app.set('view engine', 'ejs');

//creating a server using the http module (since express() doesn't return a server anymore but a function, which wouldn't work with socket.io)
const server = http.createServer(app); 

const io = socketio(server); //initialize the socket to work on the current server

//function to escape html characters : & < > " '
function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

//on the socket connection
io.on('connection', socket => {
    
    // when the current socket sends a joinRoom to join a room
    socket.on('joinRoom', ({username, room}) => {

        // add the user to the user's list in /utils/users.js
        const user = userJoin(socket.id, username, room);

        if(user) {
            // send back the user id (which is just the socket id) back to the socket/user
            socket.emit('userId', user.id);

            // add the socket to the requested room
            socket.join(user.room);

            // then send a welcome message
            socket.emit('message', formatMessage('DatCord Bot', 'DatCord Bot', 'Welcome to DatCord.'));

            // and notify the other users in the same room that a user has joined
            socket.broadcast.to(user.room).emit('message', formatMessage('DatCord Bot', 'DatCord Bot', `${user.username} has joined the chat.`));
        
            // finally send back the room id and the current online users to all the users in the room
            io.to(user.room).emit('roomUsers', {room: user.room, users: getRoomUsers(user.room)});
        }
    });

    // when a new message is sent to a room
    socket.on('chatMessage', msg => {
        // fetch which user sent the message
        const user = getCurrentUser(socket.id);

        if(user) {//checkk if the user object is valid

            //regex to detect links
            LINK_DETECTION_REGEX = /(([a-z]+:\/\/)?(([a-z0-9\-]+\.)+([a-z]{2}|aero|arpa|biz|com|coop|edu|gov|info|int|jobs|mil|museum|name|nato|net|org|pro|travel|local|internal))(:[0-9]{1,5})?(\/[a-z0-9_\-\.~]+)*(\/([a-z0-9_\-\.]*)(\?[a-z0-9+_\-\.%=&amp;]*)?)?(#[a-zA-Z0-9!$&'()*+.=-_~:@/?]*)?)(\s+|$)/gi;
            //escape HTML characters > < " '
            msg = escapeHtml(msg);

            msg = msg.replace(LINK_DETECTION_REGEX, function(url) {
                return `<a href="${url}">${url}</a> `; // replace every link with an anchor tag
            });
        
            //check if the message starts with a ?
            if(msg.startsWith('?')) {
                
                // split the message into the command, user, and content => ?[command] [user] [content]
                
                // so far only the whisper command is implemented, might add more later

                const message = msg.split('').splice(1, msg.length).join('');
                const command = message.split(' ')[0];
                const content = message.split(' ').splice(1, message.length).join(' ');

                if(command == 'whisper') { //check if the command is 'whisper'

                    // whisper is a command to send a private message to a certain user ?whisper [username] [message]
                    // the message will be sent to the user even if he's in another room, but only him will see it 

                    const target = content.split(' ').splice(0, 1).join('').trim();
                    const text = content.split(' ').splice(1, content.length).join(' ').trim();

                    if(target) { // if a username was provided

                        const targetUser = getUserByUsername(target); // get the user by his username

                        if(targetUser) { //if the target user object is valid

                            if(targetUser.id != user.id) { //if the target user is not the user himself (you can't send a provate message to yourself)

                                if(text) { //if the [content] is not empty

                                    //send the message to the target user and back to the user that sent it
                                    io.sockets.sockets[targetUser.id].emit('whisper', {...formatMessage(user.id, user.username, text), fromto: user.username});
                                    socket.emit('whisper', {...formatMessage(user.id, user.username, text), fromto: targetUser.username});
                                }
                                else { //otherwise notify the user to provide a message to be sent
                                    socket.emit('message', formatMessage('DatCord Bot', 'DatCord Bot', 'Please write a message.'));
                                }
                            }
                            else { //tell the user that he can't whisper to himself
                                socket.emit('message', formatMessage('DatCord Bot', 'DatCord Bot', 'You can\'t whisper to yourself, silly.'));
                            }
                        }
                        else { //tell the user that the target user does not exist
                            socket.emit('message', formatMessage('DatCord Bot', 'DatCord Bot', 'This user does not exist.'));
                        }
                    }
                    else { //ask the user to specify a target
                        socket.emit('message', formatMessage('DatCord Bot', 'DatCord Bot', 'Please specify a user to whisper to.'));
                    }
                }
                else { // send the message back to all the users in the room
                    io.to(user.room).emit('message', formatMessage(user.id, user.username, msg));
                }
            }
            else { // send the message back to all the users in the room
                io.to(user.room).emit('message', formatMessage(user.id, user.username, msg));
            }
        }
    });

    // when a user is typing
    socket.on('typing', () => {
        // get which user send the message
        const user = getCurrentUser(socket.id);

        if(user)
            socket.broadcast.emit('typing', user.username); // broadcast to all the users in the room except the current user (which is typing) that a user is typing
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

app.get('/', (_, res) => {
    res.render('login');
});

app.get('/chat/:username/:room', (req, res) =>{
    const username = req.params.username;
    const room = req.params.room;
    if(room && username) {
        res.render('chat', {username, room});
    }
    else {
        res.redirect('/');
    }
})

// POST ==> /roomExists params: {room: "the room id"}
app.post('/roomExists', (req, res) => {
    const room = req.body.room || ""; // get the room id sent with the request
    res.json({
        exists: roomExists(room), //send back true if the room exists, false otherwise
        users: getRoomUsers(room)
    })
});

// start the server which contains both the express app and the socket on port 5000
server.listen(5000, () => console.log('listening on 5000...'));