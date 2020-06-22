const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    let commandFile = require(`./duplicatenames.js`);
    commandFile.run(client, message, args, Discord);
    commandFile = require(`./duplicateroles.js`);
    commandFile.run(client, message, args, Discord);
    commandFile = require(`./nonicknames.js`);
    commandFile.run(client, message, args, Discord);
}