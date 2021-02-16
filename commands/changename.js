const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))[message.guild.id]
    try {
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
        if(newName.toLowerCase() == user.user.username.toLowerCase()){
            if (newName.charAt(0).toLowerCase() == user.user.username.charAt(0)) newName = newName.charAt(0).toUpperCase() + newName.substring(1)
            else {
                newName = newName.charAt(0).toLowerCase() + newName.substring(1)
            }
        }

        var checkUsers = await message.guild.members.cache.find(m => m.nickname && m.nickname.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(newName.toLowerCase()))
        if (checkUsers != undefined && checkUsers != user) {
            return message.channel.send(`There is already a user with the name: \`${newName}\` <@!${checkUsers.id}>`)
        }

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
            await user.setNickname(newName)
        } catch (e) {
            return message.channel.send(`For the following reason, I do not have permission to change this user's nickname: \`\`\`${e}\`\`\``)
        }
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`changename\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
    }
}