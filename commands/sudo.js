const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    const config = JSON.parse(fs.readFileSync('config.json'))
    if(message.author.id != config.dev){
        let owner = await client.users.fetch(config.dev)
        return owner.send(`<@${message.author.id}> just attempted to use sudo.`)
    }
    let cmd = args.shift().toLowerCase()
    let commandFile = require(`./${cmd}.js`);
    commandFile.run(client, message, args, Discord, true);
}