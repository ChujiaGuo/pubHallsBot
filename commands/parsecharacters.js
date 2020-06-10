const fs = require('fs')
const fetch = require('node-fetch')
const cors = require('cors')({ origin: true })
const cheerio = require('cheerio')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()
const Bottleneck = require("bottleneck")
const { createWorker } = require('tesseract.js')
const worker = createWorker()
const limiter = new Bottleneck({
    minTime: 1000,
    maxConcurrent: 2
})

exports.run = async (client, message, args, Discord, sudo = false, results = undefined) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    try {
        let classStats = {
            "TEMPLATE": ["HP", "MP", "ATK", "DEF", "SPD", "VIT", "WIS", "DEX"],
            "Rogue": [720, 252, 50, 25, 75, 40, 50, 75],
            "Archer": [700, 252, 75, 25, 50, 40, 50, 50],
            "Wizard": [670, 385, 75, 25, 50, 40, 60, 75],
            "Priest": [670, 385, 50, 25, 55, 40, 75, 55],
            "Warrior": [770, 252, 75, 25, 50, 75, 50, 50],
            "Knight": [770, 252, 50, 40, 50, 75, 50, 50],
            "Paladin": [770, 252, 50, 30, 55, 40, 75, 45],
            "Assassin": [720, 252, 60, 25, 75, 40, 60, 75],
            "Necromancer": [670, 385, 75, 25, 50, 30, 75, 60],
            "Huntress": [700, 252, 75, 25, 50, 40, 50, 50],
            "Mystic": [670, 385, 60, 25, 60, 40, 75, 55],
            "Trickster": [720, 252, 65, 25, 75, 40, 60, 75],
            "Sorcerer": [670, 385, 70, 25, 60, 75, 60, 60],
            "Ninja": [720, 252, 70, 25, 60, 60, 70, 70],
            "Samurai": [720, 252, 75, 30, 55, 60, 60, 50],
            "Bard": [670, 385, 55, 25, 55, 45, 75, 70]
        }
        if (!results) {
            //Begin Image Parsing
            var imageURL = args.shift();
            if (imageURL == undefined) {
                if (message.attachments.size == 1) {
                    imageURL = message.attachments.map(a => a.proxyURL)[0]
                } else {
                    return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
                }
            }
        }
        var statusEmbed = new Discord.MessageEmbed()
            .setColor("#41f230")
            .setAuthor("Parsing Information (Characters)")
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Retrieving Text`)
        var statusMessage = await message.channel.send(statusEmbed)
        if (!results) {
            try {
                //var result = await parseImage(imageURL)
                var result = await ocrClient.textDetection(imageURL)
            } catch (e) {
                return message.channel.send(`There was an error using the image to text service.\`\`\`${e}\`\`\``)
            }
        } else {
            var result = results
        }
        statusEmbed
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Text Received`)
        await statusMessage.edit(statusEmbed)
        var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ')
        //var players = result.replace(/\n/g, " ").split(' ')
        players = players.slice(players.indexOf(players.find(i => i.includes("):"))) + 1)
        for (var i in players) {
            players[i] = players[i].replace(",", "").toLowerCase().trim()
        }
        players = players.filter(Boolean)


        //Get first character
        statusEmbed
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Beginning Retrieving Realmeye Data`)
        await statusMessage.edit(statusEmbed)
        var invalidUsers = []
        var validUsers = []

        for (var i in players) {
            try {
                var url = `https://www.realmeye.com/player/${players[i]}`;
                var res = await limiter.schedule(() => fetch(url))
                var html = await res.text();
                var $ = cheerio.load(html)
                let check = ['', '', 'Class', 'L', 'CQC', 'Fame', 'Exp', 'Pl.', 'Equipment', 'Stats']
                let columns = []
                $('table[id=e]').find("tr").eq(0).find('th').each(async x => {
                    columns.push($('table[id=e]').find("tr").eq(0).find('th').eq(x).text())
                })
                var characterObject = { "Name": players[i] }
                if (JSON.stringify(columns) != JSON.stringify(check)) {
                    invalidUsers.push(players[i])
                } else {
                    columns.slice(2)
                    $('table[id=e]').find("tr").eq(1).find('td').each(async x => {
                        if (x < 8) {
                            characterObject[columns[x]] = $('table[id=e]').find("tr").eq(1).find('td').eq(x).text()
                        } else if (x == 8) {
                            let itemArray = []
                            $('table[id=e]').find("tr").eq(1).find('td').eq(x).find(".item").each(async item => {
                                let equip = $('table[id=e]').find("tr").eq(1).find('td').eq(x).find(".item").eq(item).prop("title")
                                if (item != 4) {
                                    equip = equip.split(" ")
                                    let tier = equip.pop()
                                    equip = equip.join("")
                                    equip = equip.replace(/[^a-z0-9]/gi, "")
                                    equip = client.emojis.cache.find(e => e.name.toLowerCase().includes(equip.toLowerCase()))
                                    if (equip) {
                                        itemArray.push([`<:${equip.name}:${equip.id}>`, tier])
                                    } else {
                                        itemArray.push([`⬛`, tier])
                                    }
                                } else {
                                    itemArray.push([`<:Backpack:719952565139406928>`, "UT"])
                                }

                            })
                            characterObject[columns[x]] = itemArray
                        } else if (x == 9) {
                            let totalStats = JSON.parse($('table[id=e]').find("tr").eq(1).find('td').eq(x).find(".player-stats").prop("data-stats"))
                            let statBonuses = JSON.parse($('table[id=e]').find("tr").eq(1).find('td').eq(x).find(".player-stats").prop("data-bonuses"))
                            let baseStats = []
                            for (var i in totalStats) {
                                baseStats.push(totalStats[i] - statBonuses[i])
                            }
                            characterObject[columns[x]] = baseStats
                            characterObject.Maxed = $('table[id=e]').find("tr").eq(1).find('td').eq(x).text()
                        }
                    })
                    validUsers.push(characterObject)
                }
            } catch (e) {
                message.channel.send(`There was an error fetch ${players[i]}'s Realmeye page: ${e}`)
            }
        }
        statusEmbed
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Realmeye Data Retrieval Complete`)
        await statusMessage.edit(statusEmbed)
        let requirements = config.requirements
        var noReqs = []
        for (var i in validUsers) {
            let characterObject = validUsers[i]
            let valid = await checkRequirements(characterObject)
            if (valid == undefined) {
                invalidUsers.push(characterObject.Name)
            } else {
                if (valid[0] != true) {
                    noReqs.push(`[${characterObject.Name}](https://www.realmeye.com/player/${characterObject.Name}) (${characterObject.Class}):\n Level: \`${characterObject.L}\`CQC: \`${characterObject.CQC}\`Fame: \`${characterObject.Fame}\`Place: \`${characterObject["Pl."]}\`${characterObject.Equipment.map(a => a[0]).join("")}Maxed: \`${characterObject.Maxed}\`\nReason: ${valid[1] ? valid[1].join() : undefined}`)
                }
            }
        }
        let descriptionString = noReqs.join("\n\n")
        let returnEmbed = new Discord.MessageEmbed()
            .setAuthor("The following people do not meet requirements")
            .setColor("#41f230")
            .setDescription(descriptionString.substring(0, descriptionString.substring(0, 2048).lastIndexOf("\n\n") + 2))
        descriptionString = descriptionString.substring(descriptionString.substring(0, 2048).lastIndexOf("\n\n") + 2)
        await message.channel.send(returnEmbed)
        if (invalidUsers.length > 0) {
            let returnEmbed = new Discord.MessageEmbed()
                .setAuthor("The following people have unreachable profiles")
                .setColor("#41f230")
                .setDescription(invalidUsers.join(", "))
            await message.channel.send(returnEmbed)
        }
        statusEmbed
            .setDescription(`Parsing done by: <@!${message.member.id}>\nParse status: Parsing Complete`)
        await statusMessage.edit(statusEmbed)
        async function checkRequirements(characterObject) {
            let valid = true
            let reasons = []
            //Check Gear Requirements
            let equipmentTier = characterObject.Equipment.map(a => a[1].replace(/ST/gi, "-2").replace(/UT/gi, "-1").replace(/[^0-9-\n]/gi, ""))
            for (var i in equipmentTier) {
                if (equipmentTier[i].length == 0) {
                    equipmentTier[i] = "None"
                }
            }
            if (equipmentTier[0] < requirements.weapon && equipmentTier[0] != "-1") {
                valid = false
                reasons.push(`Weapon is less than T${requirements.weapon} (${equipmentTier[0]}) `)
            }
            if (equipmentTier[1] < requirements.weapon && equipmentTier[1] != "-1") {
                valid = false
                reasons.push(`Ability is less than T${requirements.ability} (${equipmentTier[1]}) `)
            }
            if (equipmentTier[2] < requirements.weapon && equipmentTier[2] != "-1") {
                valid = false
                reasons.push(`Armor is less than T${requirements.armor} (${equipmentTier[2]}) `)
            }
            if (equipmentTier[3] < requirements.weapon && equipmentTier[3] != "-1") {
                valid = false
                reasons.push(`Ring is less than T${requirements.ring} (${equipmentTier[3]}) `)
            }
            //Check Stat Requirements
            let baseStats = characterObject.Stats
            let maxStats = classStats[characterObject.Class]
            let keys = Object.keys(requirements).slice(4)
            for (var i in baseStats) {
                if (requirements[keys[i]].toLowerCase() == "true" && maxStats[i] - baseStats[i] > 0) {
                    valid = false
                    reasons.push(`${keys[i]} is not maxed (${baseStats[i]}/${maxStats[i]})`)
                }
            }
            return [valid, reasons]
        }
    } catch (e) {
        console.log(e)
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`parsecharacters\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        message.channel.send(errorEmbed)
    }
}
async function parseImage(image) {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data: { text } } = await worker.recognize(image);
    await worker.terminate();
    return text;
}
/*
Personal Web Scraping Attempt
var url = `https://www.realmeye.com/player/${players[i]}`;
        var res = await fetch(url);
        var html = await res.text();
        var $ = cheerio.load(html)
        let characterObject = {}
        var types = ['class', 'level', 'cqc', 'fame', 'exp', 'place', 'equip', 'max']
        $('table[id=e]').find("tr").eq(1).find('td').each(async x => {
            if (x != 6 && x >= 2) {
                characterObject[types[x - 2]] = $('table[id=e]').find("tr").eq(1).find('td').eq(x).text()
            } else if (x >= 2) {
                characterObject[types[x - 2]] = $('table[id=e]').find("tr").eq(1).find('td').eq(x).attr('href')
            }
        })
        if (players[i].length > 0 && /^[A-Za-z]+$/.test(characterObject.class)) {
            characters.set(players[i], characterObject)
        }
*/