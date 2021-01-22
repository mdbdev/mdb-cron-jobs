require("dotenv").config();

const request = require("request");
const express = require("express");
const { json } = require("express");
const marked = require("marked");

const app = express();
const port = 5000;

app.get("/grades", (req, res) => {
  var Airtable = require("airtable");
  var base = new Airtable({ apiKey: process.env.AIRTABLE_AUTH_KEY }).base(
    "apprAmex487IgijRs"
  );
  var lookupKey = req.query.key;
  console.log("Looking up records for: ", lookupKey);
  base("People")
    .select({
      maxRecords: 10,
      view: "People",
      filterByFormula: "{Lookup Key}=" + lookupKey,
    })
    .firstPage(
      (err, records) => {
        if (err) {
          console.log(err);
          res.send(
            "An unknown error occurred. Please check your lookup key or try again later."
          );
          return;
        }
        records.forEach(function (record) {
          var key = record.get("Lookup Key");
          if (key == lookupKey) {
            summary += record.get("Grade Report");
            res.send(summary);
            return;
          }
        });
      },
      (err) => {
        if (err) {
          console.error(err);
          res.send(
            "An unknown error occurred. Please check your lookup key or try again later."
          );
          return;
        }
        res.send("Your lookup key was invalid.");
      }
    );
});

app.get("/postIdea", (req, res) => {
  var Airtable = require("airtable");
  var base = new Airtable({ apiKey: process.env.AIRTABLE_AUTH_KEY }).base(
    "appK9gYuFThtDMzPz"
  );
  base("Ideas")
    .select({
      maxRecords: 10,
      view: "New Ideas",
    })
    .eachPage(
      function page(records, fetchNextPage) {
        records.forEach(function (record) {
          var idea = record.get("Idea");
          var tagline = record.get("Tagline");
          var content = ">*" + tagline + "*\n" + ">" + idea;

          const webhook = process.env.SLACK_WEBHOOK_URL;

          request(
            {
              url: webhook,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                text: content,
              }),
            },
            (error, response, body) => {
              console.log("Done.");
            }
          );

          base("Ideas").update(
            [
              {
                id: record.getId(),
                fields: {
                  Posted: "True",
                },
              },
            ],
            function (err, records) {
              if (err) {
                console.error(err);
                return;
              }
            }
          );
        });
        fetchNextPage();
      },
      function done(err) {
        if (err) {
          console.error(err);
          return;
        }
        res.send(
          "Your idea should have been posted to the #feed channel! If it has not been posted, contact Shomil."
        );
      }
    );
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Listening for scheduling tasks at http://localhost:${port}`);
});
