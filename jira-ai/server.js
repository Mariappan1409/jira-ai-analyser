import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Jira proxy running");
});

app.post("/jira/search", async (req, res) => {
  try {
    const { email, token, jql, url } = req.body;

    const auth = Buffer.from(`${email}:${token}`).toString("base64");

    // Notice that "attachment" is already here in fields!
    const response = await fetch(
      `${url}/rest/api/3/search/jql?jql=${encodeURIComponent(
        jql
      )}&fields=summary,status,issuetype,assignee,description,attachment,parent,assignee&maxResults=50`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    console.log("JIRA RESPONSE:", data);

    res.json(data);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.post("/api/ask-ai", async (req, res) => {
  try {
    const { context, question } = req.body;

    // ⚠️ Put your NEW API key here inside the quotes
    const API_KEY = "AIzaSyAAYyR5tzj7gV3-6BYC7HBL1vQzs1vRjOY";

    // We will test only ONE model
    const MODEL = "gemini-2.5-flash"; 

    const prompt = `Context:\n${context}\n\nQuestion: ${question}`;
    
    const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    console.log(`Testing model: ${MODEL}...`);

    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    const data = await response.json();

    // If there is an error, it will stop here and show us
    if (!response.ok) {
      console.log("❌ Model failed!");
      console.log("Error details:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({ 
        error: "AI Model failed", 
        details: data 
      });
    }

    // If it works, it will say success
    console.log("✅ Model success!");
    return res.json(data);

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  console.log("server running on 5000");
});