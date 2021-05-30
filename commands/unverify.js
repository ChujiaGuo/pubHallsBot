const fs = require('fs')
const permcheck = require('./permcheck.js')

exports.run = async (client, message, args, Discord) => {
    let config = JSON.parse(fs.readFileSync('config.json'))
    let guildConfig = config[message.guild.id]

    if(args.length < 1) return message.channel.send("Expected at least 1 argument. Received 0.")

    let statusEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")

    let memberResolvable = args.shift()
    let reason = args.join(' ')

    let member = message.guild.members.cache.get(memberResolvable)
    if (!member) member = message.guild.members.cache.get(memberResolvable.replace(/\D/gi, ""))
    if (!member) member = message.guild.members.cache.find(m => m.nickname && m.nickname.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(memberResolvable.toLowerCase()))

    if (!member) return message.channel.send(`${memberResolvable} not found. Please check your spelling.`)

    if (await permcheck.run(client, member, guildConfig.roles.staff.eo)) {
        statusEmbed.setColor("#ff1212")
            .setAuthor("Could Not Unverify")
            .setDescription(`${member} has a role above <@&${guildConfig.roles.staff.eo}>.`)
        return message.channel.send(statusEmbed)
    } else {
        await member.roles.set([])
        await member.setNickname(null)

        statusEmbed
            .setColor("#30ffea")
            .setDescription(`You have been unverified in \`${message.guild.name}\` by ${message.author} for the following reason:\n${reason || "No reason was given."}\n\nIf this was a mistake, please contact ${message.author} at \`${message.author.tag}\` to appeal.`)

        await member.send(statusEmbed)

        let logChannel = message.guild.channels.cache.get(guildConfig.channels.log.mod)
        if (logChannel) {
            statusEmbed
                .setColor("#30ffea")
                .setAuthor("Member Unverified")
                .setDescription("")
                .addField(`User:`, member, true)
                .addField(`Mod:`, message.author, true)
                .addField(`Reason:`, reason || "No reason was given.")
            await logChannel.send(statusEmbed)
            await message.channel.send(`${member} has been unverified.`)
        }
    }
}