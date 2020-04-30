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
    if (args.length < 2) {
        return message.channel.send(`You are missing arguments. Expected 2, received ${args.length}.`)
    }

    //Get User
    var user = args.shift()
    if (isNaN(user)) {
        user = user.slice(3, -1)
    }
    try {
        user = await message.guild.members.fetch(user)
    } catch (e) {
        return message.channel.send(`Invalid User:\n\`\`\`${e}\`\`\``)
    }

    var newName = args.shift()

    var imageURL = args.shift();
    if (imageURL == undefined) {
        if (message.attachments.size == 1) {
            imageURL = message.attachments.map(a => a.url)[0]
        } else {
            return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
        }
    }
    var oldName = user.nickname
    if (oldName == undefined) {
        oldName = user.user.username + " (No Nickname)"
    }
    try {
        await user.setNickname(newName)
    } catch (e) {
        return message.channel.send(`For the following reason, I do not have permission to change this user's nickname: \`\`\`${e}\`\`\``)
    }

    var logChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.mod)
    var logEmbed = new Discord.MessageEmbed()
        .setColor("#41f230")
        .setTitle("Name Changed")
        .setDescription(`Name Changed for:\n\`${user.nickname}\` <@!${user.id}>\nOld Name: ${oldName}\nNew Name: ${newName}\nImage [Here](${imageURL})`)
        .addField(`User's Server Name: \`${user.nickname}\``, `<@!${user.id}> (Username: ${user.user.username})`, true)
        .addField(`Mod's Server Name: \`${message.member.nickname}\``, `<@!${message.member.id}> (Username: ${message.member.user.username})`, true)
        .setImage(imageURL)
        .setTimestamp()
    await logChannel.send(logEmbed)
    await message.channel.send(`Name Changed for: <@!${user.id}>`)
}