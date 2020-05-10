function err(er) { //function to display an error
    error.innerText = er;
}

function errorize(elem, er) { //function to turn the border of an element red (indicatin an error)
    elem.style.border = "1px solid red";
    err(er); //calls the error function to indicate that there is an error
}

function unerrorize(elem) { //clear errors
    elem.style.border = "none";
    elem.style.borderBottom = "1px solid rgb(100, 170, 170)";
    err("");
}

//getting elements
const join = document.getElementById('join');
const create = document.getElementById('create');
const username = document.getElementById('username');
const room = document.getElementById('room');
const error = document.querySelector('.error');

//Join a room
join.onclick = function() {
    unerrorize(username); //clear errors
    unerrorize(room);
    var quit = false;

    if(!username.value.trim()) { //check if the username value is valid
        errorize(username, "Please type something");
        quit = true;
    }
    if(!room.value.trim()) { //check if the room value is valid
        errorize(room, "Please type something");
        quit = true;
    }
    if(quit) {
        return;
    }

    // post request to check if room already exists
    $.ajax({ // POST => /roomExists
        url: 'roomExists',
        method: 'POST',
        data: {room: room.value},
        success: function(res) {
            if(res.exists) { //if the room exists redirect to the room in chat.html
                //check if the username is not used by another user
                if(res.users.filter(user => user.username == username.value).length > 0)
                    errorize(username, "This username is already used in this room");
                else
                    window.location.href = `/chat/${username.value}/${room.value}`;
            
            }
            else    //otherwise display error
                errorize(room, "This room does not exist.");
        },
        error: function() { //if there was a network error
            err("There has been an error with the server");
        }
    })
}

// Create a room
create.onclick = function() {
    unerrorize(username); //clear errors
    unerrorize(room);
    var quit = false;

    if(!username.value.trim()) { //check if the username value is valid
        errorize(username, "Please type something");
        quit = true;
    }
    if(!room.value.trim()) { // check if the room value is valid
        errorize(room, "Please type something");
        quit = true;
    }
    if(quit) {
        return;
    }

    //post request to check if room doesn't exist aleady
    $.ajax({ // POST => /roomExists
        url: 'roomExists',
        method: 'POST',
        data: {room: room.value},
        success: function(res) {
            if(res.exists) //if the room already exists display an error
                errorize(room, "This room already exists.");
            else    //otherwise redirect to the room in chat.html
                window.location.href = `/chat/${username.value}/${room.value}`;
        },
        error: function() { //if there was a network error
            err("There has been an error with the server");
        }
    });    
}