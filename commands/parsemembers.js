const fs = require('fs');
const { isRaidChannel } = require('../helpers/utilities.js');
const { tessOcr } = require('../helpers/ocrHelper.js');
const sqlHelper = require("../helpers/sqlHelper.js");
const vision = require('@google-cloud/vision');
const ocrClient = new vision.ImageAnnotatorClient();
const { createWorker } = require('tesseract.js');
const worker = createWorker()


exports.run = async (client, message, args, Discord, sudo = false) => {
    return new Promise(async (resolve, reject) => {
        var config = JSON.parse(fs.readFileSync('config.json'));
        await sqlHelper.currentWeekAdd(message.author.id,'parses', 1);

        //Channel Number
        var channelNumber = args[0]
        var imageURL = args.length > 1 ? args[1] : args[0];

        if (isNaN((channelNumber = isRaidChannel(message, args, reject)))) return reject();

        try {
            //Fetch channel
            var raidingChannel = await message.guild.channels.cache.find(c => c.id == channelNumber);
            if (!raidingChannel) {
                reject();
                return message.channel.send("Invalid Channel");
            }
            var channelMembers = raidingChannel.members;

            //Begin Image Parsing
            if (message.attachments.size == 1 || imageURL) {
                imageURL = message.attachments.map(a => a.proxyURL)[0] || imageURL;
            } else {
                reject();
                return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
            }

            var statusDescription = 'Parse status: Retrieving Text';
            var statusEmbed = new Discord.MessageEmbed()
                .setColor("#41f230")
                .setAuthor(`${message.member.displayName}\'s Parse for ${raidingChannel.name}`, message.author.displayAvatarURL())
                .setDescription(`\`\`\`${statusDescription}\n\`\`\``);
            var statusMessage = await message.channel.send(statusEmbed);
            var google = true;
            try {
                var result = await ocrClient.textDetection(imageURL);
            } catch (e) {
                statusDescription = 'Parse status: Error\nAttempting to use Tesseract OCR Text Recognition. This may take a bit longer';
                await statusMessage.edit(statusEmbed.setDescription(`\`\`\`\n${statusDescription}.\n\`\`\`\n**Error**:\n\`\`\`${e}\`\`\``));
                try {
                    var result = await tessOcr(imageURL);
                    google = false;
                } catch (e) {
                    statusDescription = 'Parse status: Error Tesseract OCR Failed';
                    await statusMessage.edit(statusEmbed.setDescription(`\`\`\`\n${statusDescription}\n\`\`\`\n**Error**:\n\`\`\`${e}\`\`\``));
                }
            }
            statusDescription = 'Parse status: Text Recieved';
            await statusMessage.edit(statusEmbed.setDescription(`\`\`\`\n${statusDescription}.\n\`\`\``));
            if (google) var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ');
            else var players = result.replace(/\n/g, " ").split(' ');

            players = players.slice(players.indexOf(players.find(i => i.includes("):"))) + 1);

            for (var i in players) {
                players[i] = players[i].replace(",", "").toLowerCase().trim();
            }

            players = players.filter(Boolean);
            var channelMembers = raidingChannel.members.map(m => `<@!${m.id}>`);

            channelMembers = raidingChannel.members.map(m => m);
            var whoText = google ? result[0].fullTextAnnotation.text : result.text;
            var crasherList = [], crasherListNames = [],  otherVCList = [], otherVCNames = [], altList = [], altListNames = [], playersInVc = [], notVet = [], matches = [];

            let commandFile = require(`./permcheck.js`);
        
            //Start channel parsing
            //People in /who but not in channel
            for (var i in players) {
                let member = message.guild.members.cache.find(n => n.nickname != null && n.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(players[i].toLowerCase()))
                if (member == undefined) {
                    //People who aren't in the server
                    crasherListNames.push(players[i].replace(/[^a-z]/gi, ""));
                    var name = new RegExp(players[i].match(/([0-9a-zA-Z ])/g).join(""), 'gi');
                    if (players[i].length > 3) whoText = whoText.replace(name, function(v) { return`**${v}**`; });
                } else if (member.voice.channel == undefined) {
                    //People who aren't in a voice channel but are a member
                    if (!(await commandFile.run(client, member, config.roles.staff.arl))) {
                        crasherListNames.push(players[i].replace(/[^a-z]/gi, ""));
                        var name = new RegExp(players[i], 'gi');
                        whoText = whoText.replace(name, function(v) { return`**${v}**`; });
                    }
                } else if (member.voice.channel != undefined && member.voice.channel != raidingChannel) {
                    //People in a different voice channel
                    otherVCList.push(`<@!${member.id}> \`${players[i]}\`: <#${member.voice.channelID}>`);
                    otherVCNames.push(`${member.displayName}`.replace(/[^a-z]/gi, ""));
                    crasherListNames.push(players[i].replace(/[^a-z]/gi, ""));
                } else {
                    //Removes them from channelMembers if they are in the correct voice channel
                    playersInVc.push(players[i].replace(/[^a-z]/gi, ""));
                    channelMembers.splice(channelMembers.indexOf(member), 1);
                }
                if (config.parsesettings.displayVet.toLowerCase() == "true"
                    && origin == 100 && !member.roles.cache.has(config.roles.general.vetraider)) {
                        notVet.push(nickname); 
                }
            }

            let altHashMap = new Map();
            channelMembers.forEach(m => {
                let memberNames = m.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|');
                for (var i of memberNames) altHashMap.set(i, m);
                altListNames = altListNames.concat(memberNames);
            });

            crasherListNames = crasherListNames.filter(Boolean);
            
            var stringSimilarity = require("string-similarity");

            if (altListNames.length > 0) {
                for (var i of altListNames) {
                    try {
                        if (i.length > 0 && Object.getPrototypeOf([]) == Array.prototype) {
                            var match = stringSimilarity.findBestMatch(i, crasherListNames).bestMatch;
                            if (match.rating > parseFloat(config.parsesettings.nameThreshold)) {
                                matches.push(`Matched: ${i} => ${match.target}`);
                                console.log(`Matched: ${i} to ${match.target}`);
                                altListNames.splice(altListNames.indexOf(i), 1);
                                altHashMap.delete(i);
                                crasherListNames.splice(crasherListNames.indexOf(match.target), 1);
                                var name = new RegExp(`\\*\\*` + match.target + `\\*\\*`, 'gi');
                                whoText = whoText.replace(name, `${match.target}`);
                            }
                            console.log(match);
                        }
                    } catch (e) {console.log(e);}
                }
            }

            altList = Array.from(altHashMap.values());
        
            for (var i of crasherListNames) {
                let member = message.guild.members.cache.find(n => n.nickname != null && n.displayName.toLowerCase().replace(/[^a-z|]/gi, '').split('|').includes(i.toLowerCase()));
                if (member == undefined) {
                    crasherList.push(i.replace(/[^a-z]/gi, ""));
                } else {
                    crasherList.push(`<@!${member.id}>`);
                }
            }
        
            try {
                statusDescription = 'Parse status: VC Parse Complete';
                statusEmbed.setDescription(`\`\`\`\n${statusDescription}\n\`\`\``)
                    .addField('Players in *Bold* are crashers:', whoText.substring(0, 950))
                    .addField('Players Crashing:', crasherList.length == 0 ? "No players are crashing!" : (crasherList.join(", ")).substring(0, 950))
                    .setTimestamp();
                if (altList.length > 0) statusEmbed.addField('Players in Your Voice Channel but not In-game (Potential alts):', altList.join(", ").substring(0, 950));
                if (otherVCList.length > 0) statusEmbed.addField('Players in Other Voice Channels: ', otherVCList.join(", ").substring(0, 950));
                if (notVet.length > 0) statusEmbed.addField('Not Veteran Raider: ', notVet.join(", ").substring(0, 950));
                if (matches.length > 0) statusEmbed.addField('Name Matches', `\`\`\`\n${(matches.join("\n")).substring(0, 950)}\n\`\`\``);
                if (crasherListNames.length > 0) statusEmbed.addField('Kick Commands', `\`\`\`\n/kick ${(crasherListNames.join(" ")).substring(0, 950)}\n\`\`\``);
                if (crasherListNames.length > 0) statusEmbed.addField('Find Command', `\`\`\`\n${config.prefix}find ${(crasherListNames.join(" ")).substring(0, 950)}\n\`\`\``);
                await statusMessage.edit(statusEmbed);
                let parsecharacters = require("./parsecharactersv2.js");
                if (playersInVc.length > -1) parsecharacters.parseCharacters(crasherListNames, Discord, message, client);
                resolve(true)
                
            } catch (e) { console.log(e); }
            
        }

        catch (e) {
            console.log(e)
            reject(false)
            let owner = await client.users.fetch(config.dev)
            var errorEmbed = new Discord.MessageEmbed()
                .setColor("#ff1212")
                .setTitle("Error")
                .setDescription(`Error Processing: \`parsemembers\`\nError Message:\`\`\`${e.toString().substring(0, 1800)}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
            await owner.send(errorEmbed)
            message.channel.send(errorEmbed)
        }
    })
}

