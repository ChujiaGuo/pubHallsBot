const fs = require('fs')
const errorHelper = require('../helpers/errorHelper.js')
const confirmationHelper = require("../helpers/confirmationHelper.js")
const sqlHelper = require("../helpers/sqlHelper.js")

exports.run = async (client, message, Discord, reaction, user) => {
    if (!message.guild) return
    let config = JSON.parse(fs.readFileSync('config.json'))[message.guild.id]
    return new Promise(async (resolve, reject) => {
        //Retriving related JSONs
        var afk = JSON.parse(fs.readFileSync('afk.json'))
        var currentleaverequests = JSON.parse(fs.readFileSync('currentleaverequests.json'))
        var queueMessage = config.afksettings.queueMessage;

        if (!afk.currentRuns[reaction.message.id] && !currentleaverequests[reaction.message.id] && reaction.message.channel.id != config.channels.log.modmail && reaction.message.id != queueMessage) {
            //Filtering Unimportant Reactions
            reject("Filtered")
        } else if (afk.currentRuns[reaction.message.id]) {
            //Deleting raiding channels
            let raidChannel = await reaction.message.guild.channels.cache.find(c => c.id == afk.currentRuns[reaction.message.id])
            await raidChannel.delete().catch(e => errorHelper.report(message, client, e))
            await reaction.message.delete().catch(e => errorHelper.report(message, client, e))

            //Removing from file
            delete afk.currentRuns[reaction.message.id]
            fs.writeFileSync('afk.json', JSON.stringify(afk))
            let currentAfks = JSON.parse(fs.readFileSync('currentAfks.json'))
            delete currentAfks[raidChannel.id]
            fs.writeFileSync('currentAfks.json', JSON.stringify(currentAfks))
        } else if (currentleaverequests[reaction.message.id]) {
            var requestMessage = reaction.message
            var requestEmbed = requestMessage.embeds[0]
            var requestObject = currentleaverequests[reaction.message.id]
            let logChannelGeneral = await reaction.message.guild.channels.cache.find(c => c.id == config.channels.log.statusupdatesgeneral)
            let logChannelMod = await reaction.message.guild.channels.cache.find(c => c.id == config.channels.log.statusupdatesmod)
            let mod = await reaction.message.guild.member(user)
            if (reaction.emoji.name == "✅") {
                try {
                    await requestMessage.reactions.removeAll()
                } catch (e) { }
                let d = new Date(requestEmbed.timestamp)
                requestEmbed
                    .setColor("#41f230")
                    .setFooter(requestEmbed.footer.text.trim() + ` ${d.toDateString()}\nRequest approved by ${mod.nickname} at `)
                    .setDescription(requestEmbed.description.substring(0, requestEmbed.description.lastIndexOf("React")))
                    .setTimestamp()
                await requestMessage.edit(requestEmbed)
                requestObject["approvedBy"] = mod.id
                let acceptedleaverequests = JSON.parse(fs.readFileSync("acceptedleaverequests.json"))
                acceptedleaverequests[requestObject.requestFrom] = requestObject
                fs.writeFileSync("acceptedleaverequests.json", JSON.stringify(acceptedleaverequests))
                delete currentleaverequests[reaction.message.id]
                fs.writeFileSync('currentleaverequests.json', JSON.stringify(currentleaverequests))
                await logChannelGeneral.send(`<@!${requestObject.requestFrom}> on leave for ${await toTimeString(requestObject.duration)}`)
                await logChannelMod.send(requestEmbed)
                let member = await reaction.message.guild.members.fetch(requestObject.requestFrom)
                await member.send("You request for leave has been accepted.")
            } else if (reaction.emoji.name == "❌") {
                try {
                    await requestMessage.reactions.removeAll()
                } catch (e) { }
                let d = new Date(requestEmbed.timestamp)
                requestEmbed
                    .setColor("#ff1212")
                    .setFooter(requestEmbed.footer.text.trim() + ` ${d.toDateString()}\nRequest denied by ${mod.nickname} at `)
                    .setDescription(requestEmbed.description.substring(0, requestEmbed.description.lastIndexOf("React")))
                    .setTimestamp()
                await requestMessage.edit(requestEmbed)
                delete currentleaverequests[reaction.message.id]
                fs.writeFileSync('currentleaverequests.json', JSON.stringify(currentleaverequests))
                let member = await reaction.message.guild.members.fetch(requestObject.requestFrom)
                await member.send("You request for leave has been denied.")
            } else if (reaction.emoji.name == "❓") {
                let d = new Date(requestEmbed.timestamp)
                requestEmbed
                    .setColor("#7f9a67")
                    .setFooter(requestEmbed.footer.text.trim() + ` ${d.toDateString()}\nRequest pending review from ${mod.nickname} at `)
                await requestMessage.edit(requestEmbed)
            }
        } else if (reaction.message.channel.id == config.channels.log.modmail && reaction.message.author.id == client.user.id && (reaction.message.embeds[0].author && !reaction.message.embeds[0].author.name.includes(" -- Resolved"))) {
            //Modmail
            if (reaction.emoji.name == "🔑") {
                await reaction.message.reactions.removeAll()
                if (!reaction.message.embeds[0].author.name.includes(" -- Resolved")) {
                    await reaction.message.react("📧")
                }
                if (!reaction.message.embeds[0].author.name.includes(" -- Resolved")) {
                    await reaction.message.react("👀")
                }
                if (!reaction.message.embeds[0].author.name.includes(" -- Resolved")) {
                    await reaction.message.react("🗑️")
                }
                if (!reaction.message.embeds[0].author.name.includes(" -- Resolved")) {
                    await reaction.message.react("❌")
                }
                if (!reaction.message.embeds[0].author.name.includes(" -- Resolved")) {
                    await reaction.message.react("🔨")
                }
                if (!reaction.message.embeds[0].author.name.includes(" -- Resolved")) {
                    await reaction.message.react("🔒")
                }
            } else if (reaction.emoji.name == "📧") {
                async function response() {
                    return new Promise(async (resolve, reject) => {
                        let sender = await reaction.message.guild.members.fetch(reaction.message.embeds[0].footer.text.split(" ")[2]).catch(e => errorHelper.report(message, client, e))
                        let responsePromptEmbed = new Discord.MessageEmbed()
                            .setColor("#30ffea")
                            .setDescription(`__How would you like to respond to ${sender}'s [message](${reaction.message.url})?__\n${reaction.message.embeds[0].description.split(" ").slice(4).join(" ").slice(1, -1)}`)
                        let response = await reaction.message.channel.send(responsePromptEmbed)
                        let responseCollectorFilter = m => m.author.id == user.id
                        let responseCollector = response.channel.createMessageCollector(responseCollectorFilter, { max: 1 })
                        responseCollector.on('collect', async m => {
                            await m.delete()
                            responsePromptEmbed.setDescription(`__Are you sure you want to respond with the following?__\n${m.content}`)
                            await response.edit(responsePromptEmbed)
                            let confirmed = await confirmationHelper.confirmMessage(response).catch(e => errorHelper.report(message, client, e))
                            if (confirmed) {
                                let responseEmbed = new Discord.MessageEmbed()
                                    .setColor("#30ffea")
                                    .setDescription(`Question: ${reaction.message.embeds[0].description.split(" ").slice(4).join(" ").slice(1, -1)}\nResponse: ${m.content}`)
                                await sender.send(responseEmbed)
                                await response.delete().catch(e => errorHelper.report(message, client, e))
                                await reaction.message.edit(reaction.message.embeds[0].addField(`Response by ${reaction.message.guild.members.cache.find(m => m.id == user.id).nickname}:`, m.content))
                                resolve(true)
                            } else {
                                await response.delete().catch(e => errorHelper.report(message, client, e))
                                reject(false)
                            }
                        })
                    })
                }
                let responded = await response().catch(e => errorHelper.report(message, client, e))

                if (responded) {
                    let embed = reaction.message.embeds[0]
                    embed.setAuthor(embed.author.name + " -- Resolved with 📧")
                    await reaction.message.edit(embed)
                    await reaction.message.reactions.removeAll().catch(e => console.log(e))
                    await reaction.message.react("📧").catch(e => console.log(e))
                } else {
                    await reaction.message.reactions.removeAll()
                    await reaction.message.react("🔑")
                }
            } else if (reaction.emoji.name == "👀") {
                let sender = await reaction.message.guild.members.fetch(reaction.message.embeds[0].footer.text.split(" ")[2]).catch(e => errorHelper.report(message, client, e))
                await sender.user.createDM()
                let messageURL = await sender.user.dmChannel.messages.fetch(reaction.message.embeds[0].footer.text.split(" ")[6])
                let receivedEmbed = new Discord.MessageEmbed()
                    .setColor("#30ffea")
                    .setDescription(`Your [message](${messageURL.url}) has been received and read.`)
                await sender.send(receivedEmbed)
                let embed = reaction.message.embeds[0]
                embed.setAuthor(embed.author.name + " -- Resolved with 👀")
                await reaction.message.edit(embed)
                await reaction.message.reactions.removeAll()
                await reaction.message.react("👀")
            } else if (reaction.emoji.name == "🗑️") {
                let embed = reaction.message.embeds[0]
                embed.setAuthor(embed.author.name + " -- Resolved with 🗑️")
                await reaction.message.edit(embed)
                await reaction.message.reactions.removeAll()
                await reaction.message.react("🗑️")
            } else if (reaction.emoji.name == "❌") {
                await reaction.message.delete().catch(e => errorHelper.report(message, client, e))
            } else if (reaction.emoji.name == "🔨") {
                let success = await sqlHelper.modmailBlacklist(reaction.message.embeds[0].footer.text.split(" ")[2]).catch(e => errorHelper.report(message, client, e))
                if (success != true) {
                    await reaction.message.channel.send(`<@!${reaction.message.embeds[0].footer.text.split(" ")[2]}> was not able to be blacklisted.`)
                } else {
                    await reaction.message.channel.send(`<@!${reaction.message.embeds[0].footer.text.split(" ")[2]}> was successfully blacklisted.`)
                }
                let embed = reaction.message.embeds[0]
                embed.setAuthor(embed.author.name + " -- Resolved with 🔨")
                await reaction.message.edit(embed)
                await reaction.message.reactions.removeAll()
                await reaction.message.react("🔨")
            } else if (reaction.emoji.name == "🔒") {
                await reaction.message.reactions.removeAll()
                await reaction.message.react("🔑")
            }
        } else if (reaction.message.id == queueMessage) {
            if(config.afksettings.queue == 'false'){return user.send("The queue system is currently disabled. Please try again later.")}
            let queuetypes = {
                "702140045997375558": "void",
                "721756760448434278": "fullskipvoid",
                "702140045833928964": "cult"
            }
            if (reaction.emoji.name == "❌") {
                await sqlHelper.removeFromQueue([user.id])
                await user.send(`You have been removed from the queue.`)
            } else {
                //Adding user to queue
                await sqlHelper.addToQueue(user.id, queuetypes[reaction.emoji.id])
                await user.send(`You have successfully been added to the ${reaction.emoji} queue. Please do not re-react or your position will be lost. If you want to leave queue, please head back and react with ❌.\nThere are currently ${await sqlHelper.queuePosition(user.id, queuetypes[reaction.emoji.id])} person(s) ahead of you.`)
            }

            //Updating queue message (if applicable)
            let embed = reaction.message.embeds[0]
            var next;
            //Normal voids
            next = await sqlHelper.nextInQueue('void')
            embed.fields.find(f => f.name.includes("702140045997375558")).value = (next.map(r => `<@!${r.userid}>`).join('\n') || "None")
            //Fullskip voids
            next = await sqlHelper.nextInQueue('fullskipvoid')
            embed.fields.find(f => f.name.includes("721756760448434278")).value = (next.map(r => `<@!${r.userid}>`).join('\n') || "None")
            //Cult
            next = await sqlHelper.nextInQueue('cult')
            embed.fields.find(f => f.name.includes("702140045833928964")).value = (next.map(r => `<@!${r.userid}>`).join('\n') || "None")
            reaction.message.edit(embed)
            //Notify user
            await reaction.users.remove(user)
        }
    })
}