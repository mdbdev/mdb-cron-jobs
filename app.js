require('dotenv').config()

const express = require('express')
const Discord = require('discord.js');
const app = express()
const port = 3000

app.get('/postIdea', (req, res) => {
    var Airtable = require('airtable');
    var base = new Airtable({apiKey: process.env.AIRTABLE_AUTH_KEY}).base('appK9gYuFThtDMzPz');
    const webhookClient = new Discord.WebhookClient(process.env.WEBHOOK_ID, process.env.WEBHOOK_TOKEN);
    base('Ideas').select({
        maxRecords: 10,
        view: "New Ideas"
    }).eachPage(function page(records, fetchNextPage) {
        records.forEach(function(record) {
            var idea = record.get('Idea');
            var tagline = record.get('Tagline');
            var content = '> Tagline: ' + tagline + '\n' + '> Idea: ' + idea;
            webhookClient.send(content);
            base('Ideas').update([{
                "id": record.getId(),
                "fields": {
                    "Posted": 'True'
                }
            }], function(err, records) {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        });
        fetchNextPage();
    }, function done(err) {
        if (err) { 
            console.error(err);
            return; 
        }
        res.send('Your idea should have been posted to the #feed channel! If it has not been posted, contact Shomil.');
    });
})

app.listen(port, () => {
  console.log(`Listening for scheduling tasks at http://localhost:${port}`)
})