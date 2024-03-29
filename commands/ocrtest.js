const fs = require('fs')
const vision = require('@google-cloud/vision')
const ocrClient = new vision.ImageAnnotatorClient()


exports.run = async (client, message, args, Discord, sudo = false) => {
    var imageURL = args.shift();
    if (imageURL == undefined) {
        if (message.attachments.size == 1) {
            imageURL = message.attachments.map(a => a.proxyURL)[0]
        } else {
            return message.channel.send("Please attach a single image, either as an URL or as a raw image.")
        }
    }

    var result = await ocrClient.textDetection(imageURL)
    var players = result[0].fullTextAnnotation.text.split(' ').slice(3)
    console.log(result)
    return message.channel.send(players.join(" "))
}