const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    const config = JSON.parse(fs.readFileSync('config.json'))
    let allMembers = message.guild.members.cache.filter(u => u.nickname && (u.roles.cache.has(config.roles.general.raider) || u.roles.cache.has(config.roles.general.eventraider))).map(m => m)
    let allNames = message.guild.members.cache.filter(u => u.nickname && (u.roles.cache.has(config.roles.general.raider) || u.roles.cache.has(config.roles.general.eventraider))).map(m => m.nickname.toLowerCase().replace(/[^a-z|]/gi,"").split("|"))
    allNames = allNames.flat()
    let uniqueNames = [... new Set(allNames)]
    for(var i in uniqueNames){
        allNames.splice(allNames.indexOf(uniqueNames[i]),1)
    }
    allNames = [... new Set(allNames)]
    var dupeUsers = ""
    for(var i in allNames){
        let dupes = allMembers.filter(m => m.nickname.toLowerCase().replace(/[^a-z|]/gi,"").split("|").includes(allNames[i]))
        dupes = dupes.map(m => `<@!${m.id}>`).join(", ")  
        dupeUsers += dupes
    }
    let duplicateEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setDescription(`The following people have duplicate names and have either the <@&${config.roles.general.raider}> role or the <@&${config.roles.general.eventraider}> role:\n${dupeUsers}`)
    await message.channel.send(duplicateEmbed)
}