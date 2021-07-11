const fs = require("fs")

exports.run = async (client, message, args, Discord, sudo = false) => {
    let currentAfks = JSON.parse(fs.readFileSync("currentAfks.json"))
    let availableChannels = []
    for (var i in currentAfks) {
        let channel = currentAfks[i]
        if (channel.allRaiders.includes(message.author.id)) {
            availableChannels.push(channel.channelId)
        }
    }
    let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
    let descriptionString = ""
    for (var i in availableChannels) {
        descriptionString += `${emojis[i]} <#${availableChannels[i]}>\n`
    }
    descriptionString = descriptionString.trim()
    if (descriptionString.length == 0) {
        descriptionString = "None"
    }
    let moveEmbed = new Discord.MessageEmbed()
        .setColor("#30ffea")
        .setAuthor("You have the option to join the following channels:")
        .setDescription(descriptionString)
    let moveMessage = await message.author.send(moveEmbed)
    var raidingChannel;
    let filter = (r, u) => !u.bot && (emojis.includes(r.emoji.name) || r.emoji.name == "❌")
    let reactions = moveMessage.createReactionCollector(filter, { max: 1 })
    reactions.on("collect", async (r, u) => {
        if (r.emoji.name != "❌") {
            raidingChannel = availableChannels[emojis.indexOf(r.emoji.name)]
            let guild = client.guilds.cache.find(g => g.id == currentAfks[raidingChannel].guildId)
            raidingChannel = await guild.channels.resolve(raidingChannel)
            moveEmbed.setDescription(`Selected ${raidingChannel}.`)
            await moveMessage.edit(moveEmbed)
            if (!raidingChannel) {
                moveEmbed.setDescription("Channel does not exist.")
                return moveMessage.edit(moveEmbed)
            } else {
                moveIn(await guild.members.resolve(message.author.id))
            }
        } else {
            moveEmbed.setDescription("Cancelled")
            await moveMessage.edit(moveEmbed)
        }
    })
    for (var i in availableChannels) {
        await moveMessage.react(emojis[i])
    }
    await moveMessage.react("❌")
    async function moveIn(reactor) {
        if (reactor.voice.channel != undefined && reactor.voice.channelID != raidingChannel.id) {
            try {
                await reactor.voice.setChannel(raidingChannel)
                await reactor.send(`You have been moved into \`${raidingChannel.name}\``)

            } catch (e) {
                message.channel.send(`<@!${reactor.id}> reacted with joinruns, but they could not be moved in.`)
            }
        } else if (reactor.voice.channelID == raidingChannel.id) {
            await reactor.send(`You are already in ${raidingChannel.name}`)
            return true
        } else if (reactor.voice.channel == undefined) {
            let draggedMessage = await reactor.send("You are not currently in a Voice Channel. Once you have joined any voice channel, react to the ✅ to get moved in to the voice channel. You can cancel at any time by reacting to the ❌")
            await draggedMessage.react("✅")
            await draggedMessage.react("❌")
            const dragFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
            let dragCollector = draggedMessage.createReactionCollector(dragFilter)
            dragCollector.on('collect', async (r, u) => {
                if (r.emoji.name == "✅") {
                    try {
                        await reactor.voice.setChannel(raidingChannel)
                        await draggedMessage.edit("You have successfully been dragged in to the voice channel.")
                        dragCollector.stop()
                    } catch (e) {
                        await draggedMessage.edit("The attempt to drag you in was unsuccessful. Please try again.")
                    }
                } else if (r.emoji.name == "❌") {
                    dragCollector.stop()
                    await draggedMessage.edit("The dragging process has been cancelled.")
                }
            })
        }
    }
}