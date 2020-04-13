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

const roomid = document.getElementById('roomid');
const userList = document.getElementById('users');
const convo = document.querySelector('.convo');
const typing = document.getElementById('typing');
const message = document.getElementById('textmessage');
const messageForm = document.getElementById('message-form');
const send = document.getElementById('send');

const {username, room} = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const socket = io();

if(username === undefined)
    window.location.href = "/";
else {
    socket.emit('joinRoom', {username, room});
}

messageForm.addEventListener('submit', function(e) {
    e.preventDefault();
    if(message.value.trim()) {
        socket.emit('chatMessage', message.value);
        var d = new Date();
        var hr = d.getHours();
        var mn = d.getMinutes();
        var ampm = "am";
        if(hr > 12) { hr -= 12; ampm = "pm" }
        var time = `${hr}:${mn} ${ampm}`;
        convo.innerHTML += `<div class="message-container me">                                    
                            <div class="message">
                                <div class="credent">
                                    <div class="user"><span>${username}</span></div>
                                    <div class="time"><span>${time}</span></div>
                                </div>
                                <div class="text">
                                    ${message.value}
                                </div>
                            </div>
                        </div>`;
        message.value = "";
        convo.scrollTop = convo.scrollHeight;
    }
})

socket.on('roomUsers', ({room, users}) => {
    roomid.innerText = room;
    userList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
});

socket.on('message', ({username, text, time}) => {
    convo.innerHTML += `<div class="message-container">                                    
                            <div class="message">
                                <div class="credent">
                                    <div class="user"><span>${username}</span></div>
                                    <div class="time"><span>${time}</span></div>
                                </div>
                                <div class="text">
                                    ${text}
                                </div>
                            </div>
                        </div>`;
    convo.scrollTop = convo.scrollHeight;
});