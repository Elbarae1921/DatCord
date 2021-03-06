const users = [];

// Join user to chat
function userJoin(id, username, room) {
    const user = {id, username, room};
    users.push(user);
    return user;
}

function getCurrentUser(id) {
    return  users.find(user => user.id === id);
}

function userLeave(id) {
    const index = users.findIndex(user => user.id === id);
    if(index !== -1) {
        return users.splice(index, 1)[0];
    }
}

function getRoomUsers(room) {
    return users.filter(user => user.room === room);
}

function roomExists(room) {
    return users.find(user => user.room === room) ? true : false;
}

function getUserByUsername(username) {
    return users.find(user => user.username == username);
}

module.exports = {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
    roomExists,
    getUserByUsername
}