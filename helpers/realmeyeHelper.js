const fs = require('fs')
const request = require('request')
const cheerio = require('cheerio')

var invalidCounter = 0
var proxyList = []
const agents = [{
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en',
    'Connection': 'keep-alive',
    'Cookie': 'gdprCookiePolicyAccepted=true; n=1',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
}, {
    'Connection': 'keep-alive',
    'Pragma': 'no-cache',
    'Cache-Control': 'no-cache',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.182 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-User': '?1',
    'Sec-Fetch-Dest': 'document',
    'Accept-Language': 'en-US,en',
    'Cookie': 'closedAlertVersion=8; n=1; gdprCookiePolicyAccepted=true'
}];


module.exports = {
    reloadProxies: async (retry = false) => {
        return new Promise(res => {
            let opt = {
                url: 'https://proxy.webshare.io/api/proxy/list/?page=0&countries=US',
                headers: { 'Authorization': 'Token 9710e00293182b4f18c94175637a08dd02aaac57' }
            }
            request(opt, async (err, resp, html) => {
                if (!html) return
                let body = JSON.parse(html)
                if (!body) {
                    if (retry) return rej('No Proxies')
                    else {
                        let err
                        let secondTry = await getProxies(true).catch(er => { err = er })
                        if (err) return rej(err)
                        return res(secondTry)
                    }
                }
                for (let i of body.results) {
                    proxyList.push(`http://${i.username}:${i.password}@${i.proxy_address}:${i.ports.http}`)
                }
                res(true)
            })
        })
    },
    retrieveProxies: async () => {
        return proxyList
    },
    discardProxies: async () => {
        proxyList = []
    },
    nextProxy: async () => {
        if (proxyList.length < 10) await module.exports.reloadProxies()
        return proxyList.shift()
    },
    requestSite: async (client, url, type = 'parse') => {
        return new Promise(async (resolve, reject) => {
            let currentProxy = await module.exports.nextProxy()
            const options = {
                proxy: currentProxy,
                headers: agents[(agents.length * Math.random()) ^ 0],
                url: url,
                method: "GET"
            }
            request(options, async (error, response, html) => {
                try {
                    if (!error && response.statusCode == 200) {
                        console.log(`Page Loaded Using: ${currentProxy}`)
                        if (type == 'parse') {
                            resolve(await module.exports.parseData(client, html, url).catch(e => e))
                        } else {
                            resolve(await module.exports.verifyData(client, html, url).catch(e => e))
                        }
                    } else {
                        if (error.message == "tunneling socket could not be established, cause=connect ECONNREFUSED 127.0.0.1:80") {
                            console.log(`Invalid Proxy: ${currentProxy}`)
                            invalidCounter += 1
                            if (invalidCounter >= 2) {
                                console.log("Reloading Proxies")
                                await module.exports.discardProxies()
                                await module.exports.reloadProxies()
                            }
                            resolve(await module.exports.requestSite(url))
                        }
                    }
                } catch (e) {
                    console.log(e)
                    reject(url)
                }
            });
        })
    },
    parseData: async (client, html, url) => {
        return new Promise(async (resolve, reject) => {
            var $ = cheerio.load(html);
            let columns = []
            $('table[class="table table-striped tablesorter"]').find("tr").eq(0).find('th').each(async x => {
                columns.push($('table[class="table table-striped tablesorter"]').find("tr").eq(0).find('th').eq(x).text())
            })
            if (columns.length != 10) {
                reject(url)
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
                resolve(characterObject)
            }
        })
    }
}
/**
 *
 *
 */