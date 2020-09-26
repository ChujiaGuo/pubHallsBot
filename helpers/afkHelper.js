const fs = require('fs')

module.exports = {
    reset: async () => {
        let currentRuns = JSON.parse(fs.readFileSync('../afk.json')).currentRuns || {}
        afk = {
            100: {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            },
            10: {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            },
            1: {
                "afk": false,
                "location": "",
                "statusMessageId": "",
                "infoMessageId": "",
                "commandMessageId": "",
                "earlyLocationIds": []
            },
            "currentRuns": currentRuns
        }
        fs.writeFileSync('../afk.json', JSON.stringify(afk))
    }
}