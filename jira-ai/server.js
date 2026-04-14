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

    const response = await fetch(
      `${url}/rest/api/3/search/jql?jql=${encodeURIComponent(
        jql
      )}&fields=summary,status,issuetype,assignee&maxResults=50`,
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
    const API_KEY = "AIzaSyB5DFOkee1HDwLN7LNQHPvC675obBc6sJI";
    
    const URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Context:\n${context}\n\nQuestion: ${question}` }]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.log("GOOGLE ERROR LOG:", JSON.stringify(data, null, 2));
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(5000, () => {
  console.log("server running on 5000");
});