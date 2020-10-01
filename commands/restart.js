const fs = require('fs')
const processManager = require("../helpers/processManager.js")

exports.run = async (client, message, args, Discord, sudo = false) => {
    let processes = JSON.parse(fs.readFileSync('processes.json'))
    var pendingMessage;
    if(processes.activeProcesses.length > 0 ){
        pendingMessage = await message.channel.send("There are active processes. Please wait...")
    }
    processes.pendingRestart = true;
    processes.botStatus = "#ff1212"
    processes.additionalInfo = "Manual Restart"
    fs.writeFileSync("processes.json", JSON.stringify(processes))
    processManager.updateStatusMessage(client)
    restart()
}

async function restart() {
    let processes = JSON.parse(fs.readFileSync('processes.json'))
    if(processes.activeProcesses.length > 0){
        let timeout = setTimeout(restart, 5000)
    }else{
        process.exit(1)
    }
}