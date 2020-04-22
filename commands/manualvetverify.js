const fs = require('fs')

exports.run = async (client, message, args, Discord) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    var user = args.shift()
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    }catch(e){
        return message.channel.send("Invalid User")
    }
    try{
        await user.roles.add(config.roles.general.vetraider)
    }catch(e){
        return message.channel.send(`Missing Permissions: \`Manage Roles\``)
    }
    let logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.mod)
    await logChannel.send(`<@!${user.id}> has been vet verified by <@!${message.author.id}>`)
}