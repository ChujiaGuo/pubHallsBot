const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    return new Promise(async (resolve, reject) => {
        try {
            let commandFile = require(`./duplicatenames.js`);
            await commandFile.run(client, message, args, Discord);
            commandFile = require(`./duplicateroles.js`);
            await commandFile.run(client, message, args, Discord);
            commandFile = require(`./nonicknames.js`);
            await commandFile.run(client, message, args, Discord);
            resolve(true)
        }
        catch (e) {
            reject(e)
        }
    })

}