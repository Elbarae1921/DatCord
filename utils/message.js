function formatMessage(userid, username, text) {
    return {
        userid,
        username,
        text,
        time: new Date().toISOString()
    }
}

module.exports = formatMessage;