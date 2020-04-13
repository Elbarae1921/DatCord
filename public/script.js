function err(er) {
    error.innerText = er;
}

function errorize(elem, er) {
    elem.style.border = "1px solid red";
    err(er);
}

function unerrorize(elem) {
    elem.style.border = "none";
    elem.style.borderBottom = "1px solid rgb(100, 170, 170)";
    err("");
}

const join = document.getElementById('join');
const create = document.getElementById('create');
const username = document.getElementById('username');
const room = document.getElementById('room');
const error = document.querySelector('.error');

join.onclick = function() {
    unerrorize(username);
    unerrorize(room);
    var quit = false;

    if(!username.value.trim()) {
        errorize(username, "Please type something");
        quit = true;
    }
    if(!room.value.trim()) {
        errorize(room, "Please type something");
        quit = true;
    }
    if(quit) {
        return;
    }
    console.log(room.value);
    $.ajax({
        url: 'roomExists',
        method: 'POST',
        data: {room: room.value},
        success: function(res) {
            if(res.exists)
                window.location.href = `/chat.html?create=false&username=${username.value}&room=${room.value}`;
            else    
                errorize(room, "This room does not exist.");
        },
        error: function() {
            err("There has been an error with the server");
        }
    })
}

create.onclick = function() {
    unerrorize(username);
    unerrorize(room);
    var quit = false;

    if(!username.value.trim()) {
        errorize(username, "Please type something");
        quit = true;
    }
    if(!room.value.trim()) {
        errorize(room, "Please type something");
        quit = true;
    }
    if(quit) {
        return;
    }
    
    window.location.href = `/chat.html?username=${username.value}&room=${room.value}`;
}