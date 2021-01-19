const fs = require('fs')
const confirmationHelper = require('../helpers/confirmationHelper.js')

exports.run = async (client, message, args, Discord, sudo = false) => {
    let runTemplates = JSON.parse(fs.readFileSync("runTemplates.json"))
    return new Promise(async (resolve, reject) => {
        var blankTemplate = { name: "", specialReacts: {}, generalReacts: [], description: "", color: "", max: "", emoji: "", earlyLocPrice: "", owner: message.author.id, id: "", reqs: "" }
        var template = await selectTemplate()
        let selectionMessage = template[0]
        let selectionEmbed = template[1]
        var displayMessage
        if (!template[2]) {
            selectionEmbed.setDescription("No Template Selected. Process Cancelled.")
            return selectionMessage.edit(selectionEmbed)
        } else {
            template = runTemplates[template[2]] || { name: "", specialReacts: {}, generalReacts: [], description: "", color: "", max: "", emoji: "", earlyLocPrice: "", owner: message.author.id, id: "", reqs: "" }
            var originalTemplate = Object.assign({}, template)
            displayMessage = await displayTemplate(displayMessage, template)
            await mainMenu(selectionMessage, selectionEmbed)
        }
        async function selectTemplate() {
            //{ specialReacts: {}, generalReacts: [], description: "", color: "", max: "", emoji: "", earlyLocPrice: "", owner: message.author.id, id:"", name:""}
            return new Promise(async (resolve, reject) => {
                let currentTemplates = Object.entries(runTemplates).filter(t => t[1].owner == message.author.id).map(t => [t[1].name, t[1].id])
                currentTemplates.push(["Create New", "New"])
                let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"].slice(0, currentTemplates.length)
                emojis.push("❌")
                if (currentTemplates.length == 1) return resolve(currentTemplates[0])
                let selectionEmbed = new Discord.MessageEmbed()
                    .setAuthor("Please choose which template to edit:")
                    .setColor("#30ffea")
                    .setDescription(`${currentTemplates.map(((e, i) => `${emojis[i]} ${e[0]}`)).join('\n')}`)
                let selectionMessage = await message.channel.send(selectionEmbed)
                let selectionCollector = selectionMessage.createReactionCollector((r, u) => !u.bot && u.id == message.author.id && emojis.includes(r.emoji.name), { limit: 1 })
                selectionCollector.on('collect', r => {
                    selectionMessage.reactions.removeAll().catch(e => e)
                    if (r.emoji.name == "❌") {
                        resolve([selectionMessage, selectionEmbed, false])

                    } else {
                        resolve([selectionMessage, selectionEmbed, currentTemplates[emojis.indexOf(r.emoji.name)][1]])
                    }
                })
                for (var e of emojis) { await selectionMessage.react(e) }

            })
        }
        async function mainMenu(selectionMessage, selectionEmbed) {
            return new Promise(async (resolve, reject) => {
                await selectionMessage.reactions.removeAll()
                selectionEmbed.setAuthor("Control Panel:").setDescription(`Currently Editing: ${template.name || "Blank Template"}\n\n✅ = Save\n♻️ = Reset to Last Save\n🗑️ = Reset\n❌ = Exit Without Saving`)
                await selectionMessage.edit(selectionEmbed)
                var baseOptionCollector = selectionMessage.createReactionCollector((r, u) => !u.bot && ["✅", "♻️", "🗑️", "❌"].includes(r.emoji.name) && u.id == message.author.id, { max: 1 })
                baseOptionCollector.on('collect', async (r, u) => {
                    if (r.emoji.name == "✅") {
                        await r.message.reactions.removeAll().catch(e => e)
                        if (template.id) {
                            selectionEmbed.setDescription("Changes have been saved. If you want to undo this, please reset the template and save again.")
                            await selectionMessage.edit(selectionEmbed)
                            await confirmationHelper.confirmMessage(selectionMessage).catch(e => e)
                            await save(template)
                        } else {
                            selectionEmbed.setDescription("You do not have an id. Please set one before saving.")
                            await selectionMessage.edit(selectionEmbed)
                            await confirmationHelper.confirmMessage(selectionMessage).catch(e => e)
                        }
                        mainMenu(selectionMessage, selectionEmbed)
                    } else if (r.emoji.name == "♻️") {
                        await r.message.reactions.removeAll().catch(e => e)
                        selectionEmbed.setDescription("Are you sure you want to clear all changes made?")
                        await selectionMessage.edit(selectionEmbed)
                        if (await confirmationHelper.confirmMessage(selectionMessage).catch(e => e)) {
                            Object.assign(template, originalTemplate)
                            displayMessage = await displayTemplate(displayMessage, template)
                            mainMenu(selectionMessage, selectionEmbed)
                        } else { mainMenu(selectionMessage, selectionEmbed) }
                    } else if (r.emoji.name == "🗑️") {
                        await r.message.reactions.removeAll().catch(e => e)
                        selectionEmbed.setDescription("Are you sure you want to reset the entire template?")
                        await selectionMessage.edit(selectionEmbed)
                        if (await confirmationHelper.confirmMessage(selectionMessage).catch(e => e)) {
                            Object.assign(template, blankTemplate)
                            displayMessage = await displayTemplate(displayMessage, template)
                            mainMenu(selectionMessage, selectionEmbed)
                        } else { mainMenu(selectionMessage, selectionEmbed) }
                    } else {
                        await r.message.reactions.removeAll().catch(e => e)
                        if (JSON.stringify(template) != JSON.stringify(originalTemplate)) {
                            selectionEmbed.setDescription("You have unsaved changes. Are you sure you want to exit without saving?")
                            await selectionMessage.edit(selectionEmbed)
                            let confirm = await confirmationHelper.confirmMessage(selectionMessage).catch(e => e)
                            if (confirm) {
                                selectionEmbed.setDescription("Closed.")
                                selectionMessage.edit(selectionEmbed)
                                displayMessage.delete().catch(e => e)
                            } else { mainMenu(selectionMessage, selectionEmbed) }
                        } else {
                            selectionEmbed.setDescription("Closed.")
                            selectionMessage.edit(selectionEmbed)
                            displayMessage.delete().catch(e => e)
                        }
                        resolve(true)

                    }
                })
                for (e of ["✅", "♻️", "🗑️", "❌"]) { await selectionMessage.react(e) }
                resolve(baseOptionCollector)
            })
        }
        async function displayTemplate(displayMessage, template) {
            return new Promise(async (resolve, reject) => {
                let emojis = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
                let options = ["description", "name", "id", "color", "max", "emoji", "price", "specialReacts", "generalReacts", "reqs"]
                let displayEmbed = new Discord.MessageEmbed()
                    .setAuthor(`${message.member.nickname.split("|")[0].replace(/[^a-z]/gi, "")}'s ${template.name || "No Name Available"}`)
                    .setColor(template.color)
                if (template.reqs) displayEmbed.setImage(template.reqs.match(/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/) ? template.reqs : null)
                for (o in options) {
                    if (options[o].includes('Reacts') || options[o].includes('emoji')) {
                        displayEmbed.addField(`${emojis[o]} ${await formatString(options[o])}`, await displayEmojis(template[options[o]]) || "N/A", true)
                    } else {
                        displayEmbed.addField(`${emojis[o]} ${await formatString(options[o])}`, template[options[o]] || "N/A", o != 0 ? true : false)
                    }
                }

                if (displayMessage) {
                    var display = await displayMessage.edit(displayEmbed)
                } else {
                    var display = await message.channel.send(displayEmbed)
                }
                displayMessage = display
                let selectionCollector = display.createReactionCollector((r, u) => !u.bot && emojis.includes(r.emoji.name), { max: 1 })
                selectionCollector.on('collect', async (r, u) => {
                    await r.users.remove(u.id)
                    let index = emojis.indexOf(r.emoji.name)
                    if (options[index].includes("Reacts") || options[index].includes("emoji")) {
                        let optionEmbed = new Discord.MessageEmbed()
                            .setAuthor(`Selection for: ${await formatString(options[index])}`)
                            .setColor(template.color)
                            .addField(`Current:`, await displayEmojis(template[options[index]]) || "N/A")
                            .addField(`New:`, `Please select your reactions below.`)
                        let optionMessage = await message.channel.send(optionEmbed)
                        //Pick Emojis
                        if (index == 5) { var selection = await setEmoji(template.emoji); optionEmbed.spliceFields(1, 1, { name: "New:", value: await displayEmojis(selection) || "N/A" }) }
                        else if (index == 7) { var selection = await setSpecial(template.specialReacts); optionEmbed.spliceFields(1, 1, { name: "New:", value: await displayEmojis(Object.keys(selection)) || "N/A" }) }
                        else if (index == 8) { var selection = await setGeneral(template.generalReacts); optionEmbed.spliceFields(1, 1, { name: "New:", value: await displayEmojis(selection) || "N/A" }) }
                        await optionMessage.edit(optionEmbed)
                        //Confirm Selection
                        let completeCollector = optionMessage.createReactionCollector((r, u) => !u.bot && u.id == message.author.id && ["✅", "❌"].includes(r.emoji.name), { max: 1 })
                        completeCollector.on('collect', async (r, u) => {
                            if (r.emoji.name == "✅") {
                                template[options[index]] = selection
                            }
                            await optionMessage.delete().catch(e => e)
                            displayMessage = await displayTemplate(displayMessage, template)

                        })
                        await optionMessage.react("✅")
                        await optionMessage.react("❌")
                    } else {
                        let optionEmbed = new Discord.MessageEmbed()
                            .setAuthor(`Selection for: ${await formatString(options[index])}`)
                            .setColor(template.color)
                            .addField(`Current:`, template[options[index]] || "N/A")
                            .addField(`New:`, `Please type your chosen ${options[index]}`)
                        let optionMessage = await message.channel.send(optionEmbed)
                        let completeCollector = optionMessage.createReactionCollector((r, u) => !u.bot && u.id == message.author.id && ["✅", "❌"].includes(r.emoji.name), { max: 1 })
                        let choiceCollector = message.channel.createMessageCollector(m => m.author.id == message.author.id)
                        //Confirm Selection
                        completeCollector.on('collect', async (r, u) => {
                            if (r.emoji.name == "✅") { template[options[index]] = optionEmbed.fields[1].value.toLowerCase() == 'none' ? "" : optionEmbed.fields[1].value }
                            optionMessage.delete()
                            selectionCollector.stop()
                            choiceCollector.stop()
                            displayMessage = await displayTemplate(displayMessage, template)

                        })
                        //Pick Text
                        choiceCollector.on('collect', async m => {
                            await m.delete().catch(e => e)
                            optionEmbed.spliceFields(1, 1, { name: "New:", value: m.content })
                            await optionMessage.edit(optionEmbed)
                        })
                        await optionMessage.react("✅")
                        await optionMessage.react("❌")
                    }
                })
                if (displayMessage.reactions.cache.size != 10) {
                    for (e of emojis) await display.react(e).catch(e => e)
                }
                resolve(displayMessage)
            })
        }
        async function setEmoji(current) {
            return new Promise(async (resolve, reject) => {
                resolve(selectEmojis(1, Array.isArray(current) ? current : current.split()))
            })
        }
        async function setSpecial(current) {
            return new Promise(async (resolve, reject) => {
                let selection = await selectEmojis(null, Object.keys(current))
                let obj = {}
                for (e of selection) obj[e] = await query(`How many of ${await displayEmojis(e)} would you like?`)

                resolve(obj)
            })
        }
        async function setGeneral(current) {
            return new Promise(async (resolve, reject) => {
                resolve(selectEmojis(null, current))
            })
        }
        async function selectEmojis(limit, current = []) {
            return new Promise(async (resolve, reject) => {
                current = current.filter(Boolean)
                let original = Object.assign([], current)
                let defaultDescription = "✅ = Save current selection\n🔍 = Search for emojis\n🗑️ = Remove from selection\n❌ = Cancel Selection"
                let options = ["✅", "🔍", "🗑️", "❌"]
                let selectionEmbed = new Discord.MessageEmbed()
                    .setAuthor("Emoji Menu")
                    .setColor("#30ffea")
                    .setDescription(defaultDescription)
                    .addField("Current Selection:", await displayEmojis(current) || "N/A")
                let selectionMessage = await message.channel.send(selectionEmbed)
                let selectionCollector = selectionMessage.createReactionCollector((r, u) => !u.bot && u.id == message.author.id && options.includes(r.emoji.name))
                selectionCollector.on('collect', async (r, u) => {
                    await r.users.remove(u.id)
                    if (options.indexOf(r.emoji.name) == 0) {
                        selectionMessage.delete().catch(e => e)
                        resolve(current.slice(0, limit || current.length))
                    }
                    else if (options.indexOf(r.emoji.name) == 1) {
                        selectionEmbed.setDescription("Please search for an emoji.")
                        await selectionMessage.edit(selectionEmbed)
                        let queryCollector = message.channel.createMessageCollector(m => m.author.id == message.author.id, { max: 1 })
                        queryCollector.on('collect', async m => {
                            let emojis = await findEmojis(m.content.toLowerCase())
                            emojis = emojis.map(e => e.id)
                            if (emojis.length == 1) {
                                current = current.concat(emojis)
                                selectionEmbed.spliceFields(0, 1, { name: "Current Selection:", value: await displayEmojis(current) || "N/A" })
                                selectionEmbed.setDescription(defaultDescription)
                            } else if (emojis.length == 0) {
                                selectionEmbed.setDescription(defaultDescription + "\n\nNo Emojis Found. Please select another option.")
                            } else if (emojis.length > 1) {
                                selectionEmbed.addField(`All matches for: ${m.content}. Please type the corresponding reactions. (1st in list = 1)`, await displayEmojis(emojis) || "N/A")
                                var choiceCollector = message.channel.createMessageCollector(m => m.author.id == message.author.id && !isNaN(m.content), { max: 1 })
                                choiceCollector.on('collect', async m => {
                                    if (emojis[m.content - 1]) {
                                        current = current.concat(emojis[m.content - 1])
                                        selectionEmbed.spliceFields(0, 2, { name: "Current Selection:", value: await displayEmojis(current) || "N/A" })
                                        selectionEmbed.setDescription(defaultDescription)
                                        await selectionMessage.edit(selectionEmbed)
                                    }
                                })
                            }

                            await selectionMessage.edit(selectionEmbed)
                        })
                    } else if (options.indexOf(r.emoji.name) == 2) {
                        selectionEmbed.setDescription("Please select the index of the emoji you would like to remove. (1st in list = 1)")
                        await selectionMessage.edit(selectionEmbed)
                        let queryCollector = message.channel.createMessageCollector(m => m.author.id == message.author.id && !isNaN(m.content), { max: 1 })
                        queryCollector.on('collect', async m => {
                            let index = m.content - 1
                            current.splice(index, 1)
                            selectionEmbed.setDescription(defaultDescription).spliceFields(0, 1, { name: "Current Selection:", value: await displayEmojis(current) || "N/A" })
                            await selectionMessage.edit(selectionEmbed)
                        })
                    } else if (options.indexOf(r.emoji.name) == 3) {
                        selectionMessage.delete().catch(e => e)
                        resolve(original.slice(0, limit || original.length))
                    }
                })
                for (e of options) { await selectionMessage.react(e) }
            })
        }
        async function save(template) {
            if (isNaN(template.earlyLocPrice)) template.earlyLocPrice = ""
            if (isNaN(template.max)) template.max = ""
            template.id = template.id.split(" ").join("")
            originalTemplate = template
            delete runTemplates[originalTemplate.id]
            runTemplates[template.id] = template
            fs.writeFileSync('runTemplates.json', JSON.stringify(runTemplates))
        }
        async function formatString(s) {
            s = splitCamelCase(s)
            return s
        }
        function splitCamelCase(word) {
            var output, i, l, capRe = /[A-Z]/;
            if (typeof (word) !== "string") {
                throw new Error("The \"word\" parameter must be a string.");
            }
            output = [];
            for (i = 0, l = word.length; i < l; i += 1) {
                if (i === 0) {
                    output.push(word[i].toUpperCase());
                }
                else {
                    if (i > 0 && capRe.test(word[i])) {
                        output.push(" ");
                    }
                    output.push(word[i]);
                }
            }
            return output.join("");
        }
        async function normalizeString(s) {
            s = s.split(' ').map((x, i) => i == 0 ? x.toLowerCase() : x).join('')
            return s
        }
        async function displayEmojis(e) {
            let emojiString = []
            if (typeof e == 'string') emojiString.push(client.emojis.cache.find(i => i.id == e))
            else if (Array.isArray(e)) { for (i of e) { emojiString.push(client.emojis.cache.find(e => e.id == i)) } }
            else { for (i in e) { emojiString.push(client.emojis.cache.find(e => e.id == i)) } }
            return emojiString.join(' ')
        }
        async function findEmojis(query) {
            return client.emojis.cache.filter(e => e.name.toLowerCase().includes(query))
        }
        async function query(m) {
            return new Promise(async (resolve, reject) => {
                let promptEmbed = new Discord.MessageEmbed()
                    .setColor("#30ffea")
                    .setDescription(m)
                let promptMessage = await message.channel.send(promptEmbed)
                let promptCollector = message.channel.createMessageCollector(m => m.author.id == message.author.id && !isNaN(m.content), { max: 1 })
                promptCollector.on('collect', m => {
                    m.delete().catch(e => e)
                    promptMessage.delete()
                    resolve(m.content)
                })
            })
        }
    })
}