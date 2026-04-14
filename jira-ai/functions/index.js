const functions = require("firebase-functions");

exports.jiraAuth = functions.https.onRequest(async (req, res) => {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).send("Missing code");
    }

    const response = await fetch(
      "https://auth.atlassian.com/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          grant_type: "authorization_code",
          client_id: "VB9SYX4sTwiXtHj9CvDRZCNURYsBcMP7",
          client_secret: "ATOA7R-p4FQiGAKLo3tYoZEgGSRN_EGDaIxNkgJWH1wumynUnZiPDqSdRsE10LFUjgpvF6E7F7CB",
          code: code,
          redirect_uri: "http://localhost:5173/callback",
        }),
      }
    );

    const text = await response.text();

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Headers", "*");
    res.set("Content-Type", "application/json");

    res.send(text);

  } catch (error) {
    console.error("Jira OAuth Error:", error);
    res.status(500).send(JSON.stringify({ error: error.message }));
  }
});