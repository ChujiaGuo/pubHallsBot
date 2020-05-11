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


exports.run = async (client, message, args, Discord, sudo = false) => {
    var config = JSON.parse(fs.readFileSync('config.json'))
    try {
        //Permissions
        if (!sudo) {
            let commandFile = require(`./permcheck.js`);
            var auth = await commandFile.run(client, message.member, 100)
            if (!auth) {
                return message.channel.send("You do not have permission to use this command.")
            }
        }
        var characters = new Map()
        var invalid = []

        //Begin Image Parsing
        var imageURL = args.shift();
        if (imageURL == undefined) {
            if (message.attachments.size == 1) {
                imageURL = message.attachments.map(a => a.proxyURL)[0]
            } else {
                return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
            }
        }
        await message.channel.send("Retrieving text...")
        try {
            //var result = await parseImage(imageURL)
            var result = await ocrClient.textDetection(imageURL)
        } catch (e) {
            return message.channel.send(`There was an error using the image to text service.\`\`\`${e}\`\`\``)
        }
        await message.channel.send("Text Received")
        var players = result[0].fullTextAnnotation.text.replace(/\n/g, " ").split(' ')
        //var players = result.replace(/\n/g, " ").split(' ')
        players = players.slice(players.indexOf(players.find(i => i.includes("):"))) + 1)
        for (var i in players) {
            players[i] = players[i].replace(",", "").toLowerCase().trim()
        }
        players = players.filter(Boolean)


        //Get first character
        var beginMessage = await message.channel.send(`Beginning retrieving realmeye data...`)
        try {
            for (var i in players) {
                var url = `https://www.realmeye.com/player/${players[i]}`;
                var res = await limiter.schedule(() => fetch(url))
                var html = await res.text();
                var $ = cheerio.load(html)
                let characterObject = { "name": players[i] }
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
                } else if (players[i].length > 0) {
                    invalid.push(players[i].charAt(0).toUpperCase() + players[i].substring(1))
                }
            }
            await message.channel.send("Realmeye data retrieval complete.")
        } catch (e) {
            return message.channel.send("There was an error fetching a realmeye page.")
        }

        var sortMaxed = {
            "8": [],
            "7": [],
            "6": [],
            "5": [],
            "4": [],
            "3": [],
            "2": [],
            "1": [],
            "0": [],
        }
        characters.forEach(u => {
            try {
                sortMaxed[u.max.charAt(0)].push(u.name.charAt(0).toUpperCase() + u.name.substring(1))
            } catch (e) {
            }

        })
        var displayEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setAuthor("Character Parsing Results:")
        for (var i in sortMaxed) {
            if (sortMaxed[i].length > 0) {
                displayEmbed.addField(`The following people are ${i}/8:`, `\`\`\`${sortMaxed[i].join(', ')}\`\`\``)
            }
        }
        invalid = invalid.join(', ')
        if (invalid.length > 0) {
            displayEmbed.addField("I could not find information on these people:", `\`\`\`${invalid}\`\`\``)
        }
        await message.channel.send(displayEmbed)
    }
    catch (e) {
        let owner = await client.users.fetch(config.dev)
        var errorEmbed = new Discord.MessageEmbed()
            .setColor("#ff1212")
            .setTitle("Error")
            .setDescription(`Error Processing: \`parsecharacters\`\nError Message:\`\`\`${e.toString()}\`\`\`\From User: <@${message.author.id}>\nIn guild: \`${message.guild.name}\``)
        await owner.send(errorEmbed)
        owner.send()
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