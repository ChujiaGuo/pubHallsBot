const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    //Permissions
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 100000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }

    //Number of arguments
    if (args.length < 2) {
        return message.channel.send(`You are missing arguments. Expected 2, received ${args.length}.`)
    }
    //Get user
    var user = args.shift()
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    } catch (e) {
        return message.channel.send(`Invalid User:\n\`\`\`${e}\`\`\``)
    }
    //Check comparative user perms
    try {
        let other = user.roles.hoist.position
        let own = message.member.roles.hoist.position
        if (other >= own) {
            return message.channel.send("You may not kick this user as their roles are equal or higher than yours.")
        }
    } catch (e) {

    }
    var reason = args.join(' ')
    if (reason.length == 0 || reason == undefined) {
        return message.channel.send("You need a reason to kick someone.")
    }
    //Kick the person
    var logChannel = message.guild.channels.cache.find(c => c.id == config.channels.log.mod)
    var kickEmbed = new Discord.MessageEmbed()
        .setColor("#ff1212")
        .setTitle("User kicked")
        .addField(`User's Server Name: \`${user.nickname}\``, `<@!${user.id}> (Username: ${user.user.username})`, true)
        .addField(`Mod's Server Name: \`${message.member.nickname}\``, `<@!${message.member.id}> (Username: ${message.member.user.username})`, true)
        .addField(`Reason for kick:`, reason)
    try {
        await user.send(kickEmbed)
        if(message.guild.id == "701484368451076127"){
            await user.send("Please rejoin the test server, thanks! https://discord.gg/CcM6vsA")
        }  
        await user.kick(reason)
        message.channel.send("Done!")
        logChannel.send(kickEmbed)
    } catch (e) {
        message.channel.send(`For the following reason, I could not kick this user:\n\`\`\`${e}\`\`\``)
    }


}