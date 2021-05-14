require('dotenv').config();

const Discord = require("discord.js");
const client = new Discord.Client();

const Config = require('../config.json');
const request = require('request');

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
})

client.on('message', msg => {
    if (msg.author.id === client.user.id) return;

    if (msg.mentions.has(client.user.id)) {
        const findText = msg.content.replace(/<@(.*?)>/gi, "").trim();

        const url = Config.URL_SEARCH + findText;
        request(url, (err, response, body) => {
            if (response.statusCode != 200) {
                msg.channel.send(`No game was found matching: '${findText}'`);
                return;
            }

            const resultData = JSON.parse(body);
            const gameList = resultData.games;
            const totalGames = resultData.totalGamesFound;

            if (totalGames==0) {
                msg.channel.send(`No game was found matching: '${findText}'`);
                return;
            }

            const firstGame = gameList[0];

            const otherGames = [];
            for(let i=1;i<Math.min(5, gameList.length);i++) {
                otherGames.push(gameList[i].name);
            }

            const gameName = firstGame.name;
            const gameImage = firstGame.imageUrl;
            const gameId = firstGame.id;
            const gameTimes = firstGame.times;
            const gameUrl = "https://howlongtobeat.com/game?id=" + gameId;

            const fieldsArray = [];
            for(const [key, value] of Object.entries(gameTimes)) {
                fieldsArray.unshift({name: key, value: value+" hours", inline: true});
            }

            if (totalGames>1) {
                fieldsArray.push({name: `Other games found (${totalGames-1})`, value: otherGames});
            }

            // TODO: solicitar detalles del juego?
            request(Config.URL_DETAILS + gameId, (err, response, body) => {
                const detailsJson = JSON.parse(body);
                const gameDescription = detailsJson.description;

                const messageEmbed = new Discord.MessageEmbed()
                .setColor("#9955ff")
                .setTitle(gameName)
                .setURL(gameUrl)
                .setDescription(gameDescription)
                .setThumbnail(gameImage)
                .addFields(
                    fieldsArray
                );

            msg.channel.send(messageEmbed);
            })
        })
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);