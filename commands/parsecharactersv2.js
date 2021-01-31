const fs = require('fs')
const request = require('request');
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

module.exports = {
    parseCharacters: async function parseCharacters(players, Discord, message, client) {
        return new Promise(async (resolve, reject) => {
            var config = JSON.parse(fs.readFileSync('config.json'))
            var statusDescription = 'Parse status: Retrieving players from RealmEye';
            var statusEmbed = new Discord.MessageEmbed()
                .setColor("#41f230")
                .setAuthor(`${message.member.displayName}\'s Parse `, message.author.displayAvatarURL())
                .setDescription(`\`\`\`\n${statusDescription}\n\`\`\``)
                .setTimestamp();
            statusMessage = await message.channel.send(statusEmbed);
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

                var bannedItems = client.guilds.cache.get(config.parsesettings.bannedItemsServer).emojis.cache.map(e => e.name.toLowerCase());

                var invalidUsers = [];
                var validUsers = [];
                var invalidUsers = [];
                var validUsers = [];
                var playersNotMeetingReqs = [];
                var receiveRequests = 0;

                var timeStarted = Date.now();

                var options = {
                    proxy: 'http://Nashex:Goldilocks1@us-wa.proxymesh.com:31280',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
                        'Proxy-Authorization': 'Basic TmFzaGV4OkdvbGRpbG9ja3Mx'
                    }
                };

                returnEmbed = new Discord.MessageEmbed()
                    .setDescription(`\`\`\`\nParse Status: Parsing Characters...\n\`\`\``)
                    .setAuthor("The Following People Do Not Meet Requirements")
                    .setColor("#41f230")
                    .setTimestamp();

                const getPlayers = async () => {
                    for (var i in players) {
                        try {
                            var url = `https://www.realmeye.com/player/${players[i]}`;
                            request(url, options, async (error, response, html) => {
                                receiveRequests++;
                                try {
                                    if (!error && response.statusCode == 200) {
                                        var $ = cheerio.load(html);
                                        //const siteBody = $('body');
                                        //console.log(siteBody.text());
                                        let columns = []
                                        $('table[class="table table-striped tablesorter"]').find("tr").eq(0).find('th').each(async x => {
                                            columns.push($('table[class="table table-striped tablesorter"]').find("tr").eq(0).find('th').eq(x).text())
                                        })
                                        if (columns.length != 10) {
                                            invalidUsers.push(players[i])
                                        } else {
                                            var characterObject = { "Name": $('title').text().split(': ')[1].split(' ')[0] }
                                            columns.slice(2)
                                            $('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').each(async x => {
                                                if (x < 8) {
                                                    characterObject[columns[x]] = $('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').eq(x).text()
                                                } else if (x == 8) {
                                                    let itemArray = []
                                                    $('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').eq(x).find(".item").each(async item => {
                                                        let equip = $('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').eq(x).find(".item").eq(item).prop("title")
                                                        if (item != 4) {
                                                            equip = equip.split(" ")
                                                            let tier = equip.pop()
                                                            equip = equip.join("")
                                                            equip = equip.replace(/[^a-z0-9]/gi, "")
                                                            equip = client.emojis.cache.find(e => e.name.toLowerCase().includes(equip.toLowerCase()))
                                                            if (equip) {
                                                                itemArray.push([`<:${equip.name}:${equip.id}>`, tier])

                                                            } else {
                                                                itemArray.push([`🚫`, tier])
                                                            }
                                                        } else {
                                                            itemArray.push([`<:Backpack:719952565139406928>`, "UT"])
                                                        }

                                                    })
                                                    characterObject[columns[x]] = itemArray
                                                } else if (x == 9) {
                                                    try {
                                                        let totalStats = JSON.parse($('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').eq(x).find(".player-stats").prop("data-stats"))
                                                        let statBonuses = JSON.parse($('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').eq(x).find(".player-stats").prop("data-bonuses"))
                                                        let baseStats = []
                                                        for (var i in totalStats) {
                                                            baseStats.push(totalStats[i] - statBonuses[i])
                                                        }
                                                        characterObject[columns[x]] = baseStats
                                                        characterObject.Maxed = $('table[class="table table-striped tablesorter"]').find("tr").eq(1).find('td').eq(x).text()
                                                    } catch (e) { }

                                                }
                                            })
                                            validUsers.push(characterObject)
                                            var valid = checkRequirements(characterObject);

                                            if (valid == undefined) {
                                                invalidUsers.push(characterObject.Name)
                                            } else {
                                                if (valid[0] != true) {
                                                    var classEmote = client.emojis.cache.find(e => e.name.toLowerCase() == characterObject.Class.toLowerCase()).toString();
                                                    returnEmbed.setFooter(`Retrieved in ${(Date.now() - timeStarted) / 1000} seconds`)
                                                        .addField(`${characterObject.Name} ${classEmote}`, `[RealmEye](https://www.realmeye.com/player/${characterObject.Name}) | **Level:** \`${characterObject.L}\` | **Fame:** \`${characterObject.Fame}\` ${characterObject.Equipment.map(a => a[0]).join("")} | **Maxed:** \`${characterObject.Maxed}\`\n\`/lock ${characterObject.Name}\`\n ${valid[1] ? valid[1].join("\n") : undefined}`)
                                                    playersNotMeetingReqs.push(characterObject.Name);
                                                    statusMessage.edit(returnEmbed);
                                                }
                                                if (receiveRequests >= players.length && receiveRequests > 0 && playersNotMeetingReqs) {
                                                    receiveRequests = -999;
                                                    returnEmbed.setDescription(`\`\`\`\nParse Status: Complete\n\`\`\``)
                                                        .setFooter(`Time taken: ${(Date.now() - timeStarted) / 1000} seconds`)
                                                    if (returnEmbed.fields.length > 0) returnEmbed.addField("Additional Kick Commands", `\`\`\`\n/kick ${playersNotMeetingReqs.join(" ")}\n\`\`\``).addField("Additional Find Command", `\`\`\`\n${config.prefix}find ${playersNotMeetingReqs.join(" ")}\n\`\`\``);
                                                    else returnEmbed.setAuthor('All Players Meet Requirements');
                                                    return resolve(await statusMessage.edit(returnEmbed));
                                                }

                                            }

                                        }
                                    } else {
                                        //console.log('Something went wrong..')
                                    }
                                } catch (e) {
                                    console.log(e)
                                    invalidUsers.push(characterObject.Name)
                                }
                            });
                        } catch (e) {
                            message.channel.send(`There was an error fetching ${players[i]}'s Realmeye page: ${e}`)
                        }
                    }
                }

                await getPlayers();

                let requirements = config.requirements;

                if (invalidUsers.length > 0) {
                    var unreachedEmbed = new Discord.MessageEmbed()
                        .setAuthor("The Following People Have Unreachable Profiles")
                        .setColor("#41f230")
                        .setDescription(invalidUsers.join(", "))
                    await message.channel.send(unreachedEmbed)
                }

                function checkRequirements(characterObject) {
                    let valid = true
                    let reasons = []
                    //Check Gear Requirements
                    if (characterObject.Equipment == undefined) return [true, reasons];
                    let equipmentTier = characterObject.Equipment.map(a => a[1].replace(/ST/gi, "-1").replace(/UT/gi, "-1").replace(/[^0-9-\n]/gi, ""))
                    for (var i in equipmentTier) {
                        if (equipmentTier[i].length == 0) {
                            equipmentTier[i] = "None"
                        }
                    }

                    for (var i in characterObject.Equipment) {
                        try {
                            if (bannedItems.some(e => e == (characterObject.Equipment[i][0].split(":")[1].toLowerCase()))) {
                                valid = false;
                                reasons.push(`Item is banned (${characterObject.Equipment[i][0]})`)
                            }
                        } catch (e) { }
                    }

                    if (characterObject.L < parseInt(requirements.level)) {
                        valid = false
                        reasons.push(`Player is below level ${requirements.level} (Lvl ${characterObject.L}) `)
                    }
                    if (parseInt(equipmentTier[0]) < parseInt(requirements.weapon) && equipmentTier[0] != "-1") {
                        valid = false
                        reasons.push(`Weapon is less than T${requirements.weapon} (T${equipmentTier[0]}) `)
                    }
                    if (parseInt(equipmentTier[1]) < parseInt(requirements.ability) && equipmentTier[1] != "-1") {
                        valid = false
                        reasons.push(`Ability is less than T${requirements.ability} (T${equipmentTier[1]}) `)
                    }
                    if (parseInt(equipmentTier[2]) < parseInt(requirements.armor) && equipmentTier[2] != "-1") {
                        valid = false
                        reasons.push(`Armor is less than T${requirements.armor} (T${equipmentTier[2]}) `)
                    }
                    if (parseInt(equipmentTier[3]) < parseInt(requirements.ring) && equipmentTier[3] != "-1") {
                        valid = false
                        reasons.push(`Ring is less than T${requirements.ring} (T${equipmentTier[3]}) `)
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
                reject();
                console.log(e);
            }

        });
    }
}    