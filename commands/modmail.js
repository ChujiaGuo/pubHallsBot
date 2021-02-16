const fs = require('fs')

exports.run = async (client, message, Discord) => {
    let config = require('../config.json')
    return new Promise(async (resolve, reject) => {

        //Confirm Modmail
        let confirmModMailEmbed = new Discord.MessageEmbed()
            .setColor("#30ffea")
            .setAuthor("Are you sure you want to send the following message to modmail?")
            .setDescription(`\`\`\`${message.content}\`\`\``)
            .setFooter("Spamming modmail will result in a blacklist.")
        let confirmModMailMessage = await message.channel.send(confirmModMailEmbed)
        let confirmationFilter = (r, u) => !u.bot && (r.emoji.name == "✅" || r.emoji.name == "❌")
        let confirmationCollector = confirmModMailMessage.createReactionCollector(confirmationFilter, { max: 1, time: 60000 })

        //Timeout
        confirmationCollector.on('end', async (c, r) => {
            if (r == 'time') {
                confirmModMailEmbed.setColor("#ff1212")
                    .setAuthor("Modmail cancelled due to time.")
                    .setDescription("")
                    .setFooter("")
                confirmModMailMessage.edit(confirmModMailEmbed)
            }
            reject("Timeout")
        })


        confirmationCollector.on("collect", async (r, u) => {
            if (r.emoji.name == "✅") {
                let guild = await selectGuild().catch(e => errorHelper.report(message, client, e))
                config = config[guild.id]
                if (!guild) {
                    return message.channel.send("There was some problem selecting a guild.")
                }
                let modmailChannel = guild.channels.cache.find(c => c.id == config.channels.log.modmail)
                if (!modmailChannel) {
                    return message.channel.send("Unfortunately, the guild you have selected does not have a modmail channel.")
                }
                let modmailEmbed = new Discord.MessageEmbed()
                    .setColor("30ffea")
                    .setAuthor(message.author.username + "#" + message.author.discriminator)
                    .setDescription(`${message.author} sent the bot: "${message.content}"`)
                    .setFooter(`User ID: ${message.author.id} | Message ID: ${message.id}`)
                    .setTimestamp()
                let modmailMessage = await modmailChannel.send(modmailEmbed).catch(e => console.log(e))
                await modmailMessage.react("🔑")
                resolve(true)
            } else {
                confirmModMailEmbed.setColor("#ff1212")
                    .setAuthor("Modmail cancelled.")
                    .setDescription("")
                    .setFooter("")
                confirmModMailMessage.edit(confirmModMailEmbed)
                reject("Cancelled")
            }
        })
        await confirmModMailMessage.react("✅")
        await confirmModMailMessage.react("❌")
    })

    async function selectGuild() {
        return new Promise(async (resolve, reject) => {
            let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
            const emojiServers = ['739623118833713214', '738506334521131074', '738504422396788798', '719905601131511850', '719905712507191358', '719930605101383780', '719905684816396359', '719905777363714078', '720260310014885919', '720260593696768061', '720259966505844818', '719905506054897737', '720260132633706577', '719934329857376289', '720260221720592394', '720260562390351972', '720260005487575050', '719905949409869835', '720260467049758781', '720260436875935827', '719905747986677760', '720260079131164692', '719932430126940332', '719905565035200573', '719905806082113546', '722999001460244491', '720260272488710165', '722999622372556871', '720260194596290650', '720260499312476253', '720259927318331513', '722999694212726858', '722999033387548812', '720260531901956166', '720260398103920670', '719905651337461820', '701251065227640932', '729861475698737193', '729859159704600648']
            let mutualGuilds = []
            var guild;
            client.guilds.cache.each(g => {
                if (g.members.cache.has(message.author.id) && !emojiServers.includes(g.id)) {
                    mutualGuilds.push(g)
                }
            })
            let guildList = mutualGuilds.length > 10 ? mutualGuilds.map((g, i) => `${i + 1} ${g.name}`).join("\n") : mutualGuilds.map((g, i) => `${emojis[i]} ${g.name}`).join("\n")
            let promptGuildEmbed = new Discord.MessageEmbed()
                .setColor("#30ffea")
                .setAuthor(mutualGuilds.length > 10 ? "Please type the number of server you would like to send this message to:" : "Please select which server you would like to send this message to:")
                .setDescription(guildList)
            var promptGuildMessage;
            if (mutualGuilds.length == 0) {
                return message.channel.send("Unfortunately, we have no shared servers.")
            } else if (mutualGuilds.length == 1) {
                guild = client.guilds.resolve(mutualGuilds[0])
                resolve(guild)
                promptGuildEmbed
                    .setAuthor(`Modmail sent to ${guild}.`)
                    .setDescription("")
                    .setFooter("")
                promptGuildMessage = await message.channel.send(promptGuildEmbed)
            } else {
                promptGuildMessage = await message.channel.send(promptGuildEmbed)
                if (mutualGuilds.length < 10) {
                    let promptGuildFilter = (r, u) => !u.bot
                    let promptGuildReactionCollector = promptGuildMessage.createReactionCollector(promptGuildFilter, { max: 1, time: 60000 })
                    promptGuildReactionCollector.on('end', async (c, r) => {
                        if (r == 'time') {
                            promptGuildEmbed.setColor("#ff1212")
                                .setAuthor("Modmail cancelled due to time.")
                                .setDescription("")
                                .setFooter("")
                            promptGuildMessage.edit(promptGuildEmbed)
                            reject(undefined)
                        }
                    })
                    promptGuildReactionCollector.on('collect', async (r, u) => {
                        if (r.emoji.name == "❌") {
                            promptGuildEmbed.setColor("#ff1212")
                                .setAuthor("Modmail cancelled.")
                                .setDescription("")
                                .setFooter("")
                            promptGuildMessage.edit(promptGuildEmbed)
                            reject(undefined)
                        } else {
                            guild = guildList.split("\n").find(v => v.split(" ")[0] == r.emoji.name).split(" ").slice(1).join(" ")
                            guild = mutualGuilds.find(g => g.name == guild)
                            resolve(guild)
                            promptGuildEmbed
                                .setAuthor(`Modmail sent to ${guild}.`)
                                .setDescription("")
                                .setFooter("")
                            await promptGuildMessage.edit(promptGuildEmbed)
                        }
                    })
                    for (var i in mutualGuilds) {
                        await promptGuildMessage.react(emojis[i])
                    }
                    await promptGuildMessage.react("❌")
                }
            }
        })
    }
}

