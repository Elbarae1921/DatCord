// ==> jquery code for some elements to be hidden on mobile view
$(document).ready(function() {
    $("#textmessage").emojioneArea();
});

$('.page-container').on('click', '.show', function() {
    this.innerText = "<";
    document.querySelector('.info').classList.remove('hidden');
    this.classList.add('hide');
    this.classList.remove('show');
});

$('.page-container').on('click', '.hide', function() {
    this.innerText = ">";
    document.querySelector('.info').classList.add('hidden');
    this.classList.add('show');
    this.classList.remove('hide');
});

$('.convo').on('click', function() {
    document.querySelector('.emojionearea-editor').focus();
});

$('.page-container').on('keyup', '.emojionearea-editor', function(e) {
    // if enter is pressed, trigger submit
    if (e.keyCode == 13) {
        return messageForm.requestSubmit();
    }
    socket.emit('typing'); //notify the socket that the user is typing
});


// ==> user ID to differentiate the user's message from other messages
var userID;

// ==> initialazing a websocket connection
const socket = io();

// ==> checking if the username and room were provided
if(!username || !room) // if no go back to index
    window.location.href = "/";
else { // if yes, join the room
    socket.emit('joinRoom', {username, room});
}




// ==> get document elements
const roomid = document.getElementById('roomid');
const userList = document.getElementById('users');
const convo = document.querySelector('.convo');
const typing = document.getElementById('typing');
const message = document.getElementById('textmessage');
const messageForm = document.getElementById('message-form');
const send = document.getElementById('send');
const leave = document.getElementById('leave');

// ==> initialazing variables
var isTyping = false;
var cancel = 0;
var oldVal = '';



// ==> functions
function addMessage(username, time, message, me='', whisper=false, fromto='') { //function to add a message to the page
    time = getTime(time); //parsing the time string

    // ==> creating the element that holds the username
    var userElem = document.createElement('div'); //create the element
    userElem.classList.add("user"); //add the corresponding class
    userElem.innerHTML = "<span></span>";
    userElem.firstElementChild.innerText = username; //add the username

    //if the message is a whisper
    if(whisper) {
        if(me)
            userElem.innerHTML += `<span class="whisper">[whisper to ${fromto}]</span>`;
        else
            userElem.innerHTML += `<span class="whisper">[whisper from ${fromto}]</span>`;
    }
    
    // ==> creating the element that holds the time
    var timeElem = document.createElement('div'); //create the element
    timeElem.classList.add("time"); //add the corresponding class
    timeElem.innerHTML = "<span></span>";
    timeElem.firstElementChild.innerText = time; //add the time

    // ==> creating the element that holds the message text
    var textElem = document.createElement('div'); //create the element
    textElem.classList.add("text"); //add the corresponding class
    textElem.innerHTML = message; //add the message text

    // ==> creating the element that contains the username element and time element
    var credElem = document.createElement('div'); //create the element
    credElem.classList.add("credent"); //add the corresponding class
    credElem.appendChild(userElem); //append the elements
    credElem.appendChild(timeElem);

    // ==> creating the element that contains the previous element and the message text element
    var messageElem = document.createElement('div'); //create the element
    messageElem.classList.add("message"); //add the corresponding class
    messageElem.appendChild(credElem); //append the elements
    messageElem.appendChild(textElem);

    // ==> creating the element that contains the message element
    var messageContainerElem = document.createElement('div'); //create the element
    messageContainerElem.classList.add("message-container"); //add the corresponding class
    if(me) messageContainerElem.classList.add(me); // check if the message is the user's own 
    messageContainerElem.appendChild(messageElem); //append elements

    convo.appendChild(messageContainerElem); //append the message to the conversation

    // convo.innerHTML += `<div class="message-container ${me}">                                    
    //                         <div class="message">
    //                             <div class="credent">
    //                                 <div class="user"><span>${username}</span></div>
    //                                 <div class="time"><span>${time}</span></div>
    //                             </div>
    //                             <div class="text">
    //                                 ${message}
    //                             </div>
    //                         </div>
    //                     </div>`;
    convo.scrollTop = convo.scrollHeight; //scroll the conversation to the latest message
}

function setTyping(username) { //executes when the socket says that a user is typing
    isTyping = true;
    typing.firstElementChild.innerHTML = `${username} is typing ...`;
}

function cancelTyping() { //executes 1s after setTyping()
    typing.firstElementChild.innerHTML = "";
    isTyping = false;
}

function getTime(date) { //parse the datetime string recieved form the server
    var d = new Date(date);
    var hr = d.getHours();
    var mn = d.getMinutes().toString().length > 1 ? d.getMinutes() : `0${d.getMinutes()}`;
    var ampm = "am";
    if(hr > 12) { hr -= 12; ampm = "pm" }
    return `${hr}:${mn} ${ampm}`;
}









// ==> message send event
messageForm.addEventListener('submit', function(e) {
    e.preventDefault(); //prevent the form from submitting
    document.querySelector('.emojionearea-editor').blur();
    console.log(message.value);
    if(message.value.trim()) { //check if there is something in the message field
        socket.emit('chatMessage', message.value); //send the message to the socket
        message.value = ''; //empty the message field
        $('.emojionearea-editor').html('');
        document.querySelector('.emojionearea-editor').focus(); //focus on the message field
    }
});


// ==> typing event
// message.addEventListener('keyup', function() { //when the message field's value is changed
//     console.log('wzzup');
//     if(this.value != oldVal) { //compare the current value of the input to its value from the last keyup event
        
//         if(this.value.trim() != '') { //skip if the field only contains white space

//             socket.emit('typing'); //notify the socket that the user is typing

//             oldVal = this.value; //set the old value to the current one
//         }
//     }
// });

// ==> leave button click event
leave.onclick = function() {
    window.location.href = '/'; //go back to the index page
}












// ==> the first message from the socket is the user's own id
socket.on('userId', userId => {
    userID = userId; //set the user id to identify the user's own messages
})

// ==> the second message from the socket, which is the users in this room
socket.on('roomUsers', ({room, users}) => {
    roomid.innerText = room;
    userList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
});

// ==> when a message is recieved
socket.on('message', ({userid, username, text, time}) => {
    clearTimeout(cancel); //clear timeout to stop the typing notification if it was active
    cancelTyping(); //cancel the typing notification
    var me = userid == userID ? "me" : ""; //check if the message is from the current user
    addMessage(username, time, text, me); //add the message to the conversation
});

// ==> when a whisper is recieved
socket.on('whisper', ({userid, username, text, time, fromto}) => {
    clearTimeout(cancel); //clear timeout to stop the typing notification if it was active
    cancelTyping(); //cancel the typing notification
    var me = userid == userID ? "me" : ''; //check if the whisper is from the current user
    addMessage(username, time, text, me, true, fromto); //add the whisper to the conversation
    console.log(fromto);
});

// ==> when a user is typing
socket.on('typing', username => {
    if(!isTyping) { //check if it wasn't triggered before
        setTyping(username) //set the username of the user that's typing "user is typing..."
        cancel = setTimeout(() => { //store the setTimeOut number in a variable to cancel it if another typing event is triggered after less than a second
            cancelTyping(); //after one second remove the "user is typing..."
        }, 1000); 
    }
    else { //if it was triggered before (which means it hasn't been more than one second since the last typing event)
        clearTimeout(cancel); //clear the last timeout to set a new one
        cancel = setTimeout(() => { //set a new one and store it in a variable
            cancelTyping(); //after one second remove the "user is typing..."
        }, 1000);
    }
})
