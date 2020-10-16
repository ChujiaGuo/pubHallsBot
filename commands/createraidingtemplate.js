const fs = require('fs')
const confirmationHelper = require('../helpers/confirmationHelper.js')

exports.run = async (client, message, args, Discord, sudo = false) => {
    return new Promise(async (resolve, reject) => {
        var runTemplates = JSON.parse(fs.readFileSync('runTemplates.json'))
        let templateBase = { "specialReacts": [], "generalReacts": [], "description": "", "name": "", "color": "", "max": "", "emoji": "", "earlyLocPrice": "" }
        templateBase = runTemplates[message.author.id] || templateBase
        var optionCollector
        var displayMessage = await displayEmbed()
        var editingMessage, editingEmbed

        //Define Functions
        async function displayEmbed(displayMessage) {
            let displayEmbed = new Discord.MessageEmbed()
                .setAuthor("These are your current settings")
                .setColor(templateBase.color)
                .setDescription("Respond with `close` to save and exit.\nRespond with `cancel` to exit without saving.\n\nTo edit a field, repond with it's corresponding number.")
                .addField("1. Name", templateBase.name || "None")
                .addField("2. Description", templateBase.description || "None")
                .addField("3. Special Reacts", await displayEmojis(templateBase.specialReacts, true) || "None")
                .addField("4. Normal Reacts", await displayEmojis(templateBase.generalReacts, true) || "None")
                .addField("5. Primary Emoji", client.emojis.cache.find(e => e.id == templateBase.emoji) || "None")
                .addField("6. Color", templateBase.color || "None")
                .addField("7. Max Raiders", templateBase.max || "N/A")
                .addField("8. Early Location Price", templateBase.earlyLocPrice || "N/A")
            if (displayMessage) {
                await displayMessage.edit(displayEmbed).catch(e => console.log(e))
            } else {
                displayMessage = await message.channel.send(displayEmbed)
            }
            createOptionCollectors(displayMessage.channel)
            return displayMessage

        }
        async function createOptionCollectors(channel) {
            optionCollector = channel.createMessageCollector((m) => m.author.id == message.author.id, { max: 1 })
            optionCollector.on('collect', async m => { await m.delete().catch(e => e); await selectOption(m.content) })
        }
        async function selectOption(option) {
            if ((parseInt(option) >= 1 && parseInt(option) <= 8) || ['close', 'cancel'].includes(option)) {
                let options = ['name', 'description', 'specialReacts', 'generalReacts', 'emoji', 'color', 'max', 'earlyLocPrice']
                let displayValues = ['Name', 'Description', 'Special Reacts', 'Normal Reacts', 'Primary Emoji', 'Color', 'Max Raiders', 'Early Location Price']
                let index = !isNaN(option) ? (parseInt(option) - 1) : option

                if (index == 'close') { await save(); await close(); }
                else if (index == 'cancel') { await close() }
                else if (index >= 2 && index <= 4) { await editEmojis(options[index], displayValues[index]) }
                else { await editString(options[index], displayValues[index]) }
            } else { displayEmbed(displayMessage) }
        }
        async function editString(option, value) {
            editingEmbed = new Discord.MessageEmbed()
                .setColor(templateBase.color)
                .setAuthor(`Currently Editing: ${value}`)
                .setDescription(`Please respond with your new ${value}.\n\nRespond with \`done\` once complete.`)
                .addField(`Old:`, templateBase[option] || 'None')
                .addField(`New:`, templateBase[option] || 'None')
            if (editingMessage) {
                editingMessage = await editingMessage.edit(editingEmbed)
            } else {
                editingMessage = await message.channel.send(editingEmbed)
            }
            let newCollector = editingMessage.channel.createMessageCollector(m => m.author.id == message.author.id)
            newCollector.on('collect', async m => {
                await m.delete().catch(e => e)
                if (m.content.toLowerCase() != 'done') {
                    if (option == 'color' && !m.content.match(/^#?[a-f0-9]{6}$/gi)) m.content = `Invalid Color Code: ${m.content}`
                    else if (option == 'color' && m.content.charAt(0) != "#") m.content = "#" + m.content
                    else if ((option == "max" || option == "earlyLocPrice") && isNaN(m.content)) m.content = `Invalid ${value}: ${m.content} is not a number.`
                    editingEmbed.fields[1].value = m.content
                    await editingMessage.edit(editingEmbed).catch(e => e)
                } else {
                    newCollector.stop()
                    templateBase[option] = editingEmbed.fields[1].value.includes("Invalid") ? "" : editingEmbed.fields[1].value
                    editingEmbed.spliceFields(0, 2)
                        .setDescription("Please choose another option.")
                        .setAuthor("Currently Editing: None")
                        .setColor(templateBase.color)
                    await editingMessage.edit(editingEmbed)
                    await displayEmbed(displayMessage)
                }
            })
        }
        async function editEmojis(option, value) {
            if (typeof templateBase[option] == "string") templateBase[option] = templateBase[option].split(" ")
            editingEmbed = new Discord.MessageEmbed()
                .setColor(templateBase.color)
                .setAuthor(`Currently Editing: ${value}`)
                .setDescription(`React with 🔍 to search for emojis. React with ✅ once complete.`)
                .addField(`Old:`, await displayEmojis(templateBase[option], true) || 'None')
                .addField(`New:`, await displayEmojis(templateBase[option], true) || 'None')
            if (editingMessage) {
                editingMessage = await editingMessage.edit(editingEmbed)
            } else {
                editingMessage = await message.channel.send(editingEmbed)
            }
            await editingMessage.react("🔍")
            await editingMessage.react("✅")
            let endCollector = editingMessage.createReactionCollector((r, u) => !u.bot && ["🔍", "✅"].includes(r.emoji.name) && u.id == message.author.id)
            endCollector.on('collect', async (r, u) => {
                if (r.emoji.name == "🔍") {
                    templateBase[option] = await selectEmojis(templateBase[option]).catch(e => e)
                    editingEmbed.fields[1].value = await displayEmojis(templateBase[option], true) || 'None'
                    await editingMessage.edit(editingEmbed)
                } else {
                    endCollector.stop()
                    editingMessage.reactions.removeAll().catch(e => e)
                    templateBase[option] = editingEmbed.fields[1].value.includes("Invalid") ? "" : editingEmbed.fields[1].value.replace(/T\d+|[^\d:]/gi, "").substring(2).split("::")
                    if (option == "emoji") {
                        templateBase[option] = templateBase[option][0]
                    }
                    editingEmbed.spliceFields(0, 2)
                        .setDescription("Please choose another option.")
                        .setAuthor("Currently Editing: None")
                        .setColor(templateBase.color)
                    await editingMessage.edit(editingEmbed)
                    await displayEmbed(displayMessage)
                }
            })
        }
        async function selectEmojis(array) {
            return new Promise(async (resolve, reject) => {
                let emojiEmbed = new Discord.MessageEmbed()
                    .setColor(templateBase.color)
                    .setDescription("React with 🔍 to query an emoji.\nReact with 🚫 to remove an emoji.\nReact with ✅ to return.")
                    .addField("Current Selection:", await displayEmojis(array, true) || "None")
                let emojiMessage = await message.channel.send(emojiEmbed)
                let optionCollector = emojiMessage.createReactionCollector((r, u) => !u.bot && ["🔍", "✅", "🚫"].includes(r.emoji.name) && u.id == message.author.id)
                optionCollector.on('collect', async (r, u) => {
                    if (r.emoji.name == "🔍") {
                        emojiEmbed.setDescription("Please enter a query.")
                        await emojiMessage.edit(emojiEmbed)
                        let queryCollector = emojiMessage.channel.createMessageCollector(m => m.author.id == message.author.id, { max: 1 })
                        queryCollector.on('collect', async m => {
                            await m.delete().catch(e => e)
                            let query = m.content
                            let emojiArray = client.emojis.cache.filter(e => e.name.toLowerCase().includes(query.toLowerCase())).map(e => e.id)
                            if (emojiArray.length != 1) {
                                message.channel.send(await displayEmojis(emojiArray, true) || "None").then(m => m.delete({ timeout: 15000 })).catch(e => e)
                            } else {
                                array = array.concat(emojiArray)
                                emojiEmbed.fields[0].value = await displayEmojis(array, true) || "None"
                                await emojiMessage.edit(emojiEmbed)
                            }
                        })
                    } else if (r.emoji.name == "🚫") {
                        emojiEmbed.setDescription("Which emoji would you like to delete? Please enter a name.")
                        await emojiMessage.edit(emojiEmbed)
                        let queryCollector = emojiMessage.channel.createMessageCollector(m => m.author.id == message.author.id, { max: 1 })
                        queryCollector.on('collect', async m => {
                            await m.delete().catch(e => e)
                            let emojiArray = await displayEmojis(array)
                            let index = emojiArray.indexOf(emojiArray.find(e => e.name.toLowerCase().includes(m.content.toLowerCase())))
                            if (index != -1) {
                                emojiArray.splice(index, 1)
                            }
                            array = emojiArray.map(e => e.id)
                            emojiEmbed.fields[0].value = await displayEmojis(array, true) || "None"
                            await emojiMessage.edit(emojiEmbed)
                        })
                    } else {
                        await emojiMessage.delete()
                        optionCollector.stop()
                        resolve(array)
                    }
                })
                await emojiMessage.react("🔍")
                await emojiMessage.react("🚫")
                await emojiMessage.react("✅")
            })
        }
        async function displayEmojis(array, toString) {
            if (toString) return array.map(eid => client.emojis.cache.find(e => e.id == eid)).join("")
            return array.map(eid => client.emojis.cache.find(e => e.id == eid))

        }
        async function close() {
            if(editingMessage) await editingMessage.delete().catch(e => e)
            let closingEmbed = new Discord.MessageEmbed()
                .setColor(templateBase.color)
                .setDescription("The template has been closed.")
            await displayMessage.edit(closingEmbed)
        }
        async function save() {
            runTemplates[message.author.id] = templateBase
            fs.writeFileSync('runTemplates.json', JSON.stringify(runTemplates))
        }
    })
}