const fs = require('fs')
const sqlHelper = require('../helpers/sqlHelper.js')

exports.run = async (client, message, args, Discord) => {
    var getUser = async (userResolvable) => {
        /* 
        * If the userResolvable is a nickname
        */
        if (isNaN(userResolvable)) {
            var user = message.guild.members.cache.find(m => m.displayName && m.displayName.toLowerCase().replace(/[^a-z|]/gi, "").split("|").includes(userResolvable.toLowerCase())) || false;
        } else {
            var user = await message.guild.members.fetch(userResolvable).catch(e => false)
        }
        return user;
    }
    var displayWarns = (userJSON, user) => {
        if (!userJSON) return user
        userJSON = userJSON.map((w,i) => `Warn #${i+1}\nReason: ${w.reason}\nMod: <@!${w.modid}>`)
        let displayEmbed = new Discord.MessageEmbed()
            .setColor("#30ffea")
            .setDescription(`**__Warns for <@!${user.id}>__**\n\n${userJSON.join("\n")}`)
            .setTimestamp()
        message.channel.send(displayEmbed)
    }
    var invalidUsers = [] //Array of user resolvables
    var invalidDatabaseUsers = [] // Array of users
    if (args.length >= 1) {
        for (i in args) {
            var user = await getUser(args[i])
            if (user) {
                let status = await displayWarns(await sqlHelper.get('warns', 'id', user.id), user.user);
                if (status) invalidDatabaseUsers.push(status);
            } else { invalidUsers.push(args[i]) }
        }
    }else{
        return message.channel.send("You are missing some arguments!")
    }
    if (invalidUsers.length > 0) {
        let invalidUsersEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor("The following users could not be found:")
            .setDescription(invalidUsers.join(", "))
        message.channel.send(invalidUsersEmbed)
    }
    if (invalidDatabaseUsers.length > 0) {
        let invalidUsersEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor("The following users are not in the database or have no warns:")
            .setDescription(invalidDatabaseUsers.join(", "))
        message.channel.send(invalidUsersEmbed)
    }

}