const fs = require('fs')

exports.run = async (client, message, args, Discord, sudo = false) => {
    let portalGuilds = await client.guilds.cache.filter(g => g.name.includes("rotmgportal")).map(g => g)
    let keyGuilds = await client.guilds.cache.filter(g => g.name.includes("rotmgkeys")).map(g => g)

    let allKeys = []
    let allPortals = []
    for (var g in keyGuilds) {
        let guild = keyGuilds[g]
        let guildEmojis = await guild.emojis.cache.map(e => e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`)
        allKeys = allKeys.concat(guildEmojis)
    }
    for (var g in portalGuilds) {
        let guild = portalGuilds[g]
        let guildEmojis = await guild.emojis.cache.map(e => e.animated ? `<a:${e.name}:${e.id}>` : `<:${e.name}:${e.id}>`)
        allPortals = allPortals.concat(guildEmojis)
    }

    for (var key in allKeys) {
        let name = allKeys[key].replace(/[^a-z]/gi, "")
        if (name.charAt(0) == 'a') name = name.substring(1)
        name = name.replace("Key", "")
        let portalEmoji = allPortals.find(p => p.includes(`:${name}`))
        allKeys[key] = portalEmoji + allKeys[key] + " " + name
    }
    allKeys = allKeys.join("\n")
    let dungeonsEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor("List of dungeons you can do!")
        .setDescription("You can reference a dungeon by typing out the name displayed. Case does not matter.")
    while (allKeys.length > 1024) {
        let last = allKeys.substring(0, 1000).lastIndexOf("\n") + 1
        let string = allKeys.substring(0, last)
        dungeonsEmbed.addField("<:Empty:720405765994709035>", string)
        allKeys = allKeys.substring(last)
    }
    dungeonsEmbed.addField("<:Empty:720405765994709035>", allKeys)
    message.channel.send(dungeonsEmbed)
}