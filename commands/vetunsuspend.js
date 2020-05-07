const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    if (!sudo) {
        let commandFile = require(`./permcheck.js`);
        var auth = await commandFile.run(client, message.member, 10000)
        if (!auth) {
            return message.channel.send("You do not have permission to use this command.")
        }
    }
    var config = JSON.parse(fs.readFileSync('config.json'))
    var suspensions = JSON.parse(fs.readFileSync('suspensions.json'))
    var user = args.shift()
    if (isNaN(user)) {
        if (isNaN(user.slice(3, -1)) || user.slice(3, -1).length == 0) {
            //Get from nickname
            try {
                user = await message.guild.members.cache.find(m => m.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(user.toLowerCase()))
            } catch (e) {
                returnEmbed.setColor("#ff1212")
                returnEmbed.setDescription(`I could not find a user with the nickname of: ${args[i]}`)
                returnEmbed.addField("Error:", e.toString())
            }
        } else {
            //Get from mention
            try {
                user = await message.guild.members.fetch(user.slice(3, -1))
            } catch (e) {
                returnEmbed.setColor("#ff1212")
                returnEmbed.setDescription(`I could not find a user with the mention of: <@!${args[i]}>`)
                returnEmbed.addField("Error:", e.toString())
            }
        }
    } else {
        //Get from id
        try {
            user = await message.guild.members.fetch(user)
        } catch (e) {
            returnEmbed.setColor("#ff1212")
            returnEmbed.setDescription(`I could not find a user with the id of: \`${args[i]}\``)
            returnEmbed.addField("Error:", e.toString())
        }
    }
    if(user == undefined){
        return message.channel.send("Invalid User")
    }

    var reason = args.join(' ')
    if (reason.length == 0 || reason == undefined) {
        return message.channel.send("Please put a reason for unsuspending.")
    }

    try {
        await user.roles.remove(config.roles.general.vetsuspended)
    } catch (e) {
        return message.channel.send(`I could not remove the Vet Suspended role from <@!${user.id}> because of the following reason: ${e}`)
    }
    /* if (suspensions.veteran[user.id] == undefined) {
        return message.channel.send("I do not have records of this user being suspended. Please try another bot.")
    } */

    var suspendChannel = await message.guild.channels.cache.find(c => c.id == config.channels.log.suspend)
    //Deal with roles
    await user.roles.add(config.roles.general.vetraider)
    await user.roles.remove(config.roles.general.vetsuspended)
    //Broadcast the unsuspension
    await user.send("You have been unsuspended.")
    await message.channel.send(`<@${user.id}> has been un-vetsuspended.`)
    await suspendChannel.send(`<@${user.id}> has been un-vetsuspended.`)
    //Edit suspension message
    try{
        var suspensionMessage = await suspendChannel.messages.fetch(suspensions.veteran[user.id].suspendlog)
        let suspendEmbed = suspensionMessage.embeds[0]
        suspendEmbed
        .setColor("#41f230")
        .setDescription("This user has been unsuspended")
        .addField("Reason for unsuspension:",reason, false)
        .setFooter("Unsuspended")
        await suspensionMessage.edit(suspendEmbed)
    }catch(e){
        console.log(e)
    }
    //Remove from log
    try {
        delete suspensions.veteran[user.id]
        fs.writeFileSync("suspensions.json", JSON.stringify(suspensions))
    } catch (e) {

    }
}