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
    var displayStats = (userJSON, user) => {
        if (!userJSON) return user
        let displayEmbed = new Discord.MessageEmbed()
            .setColor("#30ffea")
            .setDescription(`**__Stats for <@!${userJSON.id}>__**\n\n**__Points:__** ${userJSON.points}`)
            .addField("**__Keys Popped:__**", `Lost Halls: ${userJSON.keypops}\nOther: ${userJSON.eventpops}`, true)
            .addField("**__Runs Done:__**", `Cults: ${userJSON.cultRuns}\nVoids: ${userJSON.voidRuns}\nOryx 3: ${userJSON.o3runs}\nSolo Cults*: ${userJSON.solocult}`, true)
            .addField("**__Runs Led:__**", `Cults: ${userJSON.cultsLead}\nVoids: ${userJSON.voidsLead}\nOryx 3: ${userJSON.o3leads}`, true)
            .setFooter(`*Deprecated`)
            .setTimestamp()
            .setThumbnail(user.avatarURL())
        message.member.send(displayEmbed)
    }
    var invalidUsers = [] //Array of user resolvables
    var invalidDatabaseUsers = [] // Array of users
    if (args.length >= 1) {
        for (i in args) {
            var user = await getUser(args[i])
            if (user) {
                let status = await displayStats(await sqlHelper.get('users', 'id', user.id), user.user);
                if (status) invalidDatabaseUsers.push(status);
            } else { invalidUsers.push(args[i]) }
        }
    } else {
        let status = await displayStats(await sqlHelper.get('users', 'id', message.author.id), message.author);
        if (status) invalidDatabaseUsers.push(status);
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
        .setAuthor("The following users are not in the database:")
        .setDescription(invalidDatabaseUsers.join(", "))
        message.channel.send(invalidUsersEmbed)
    }
    
}