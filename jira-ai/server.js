import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const PORT = process.env.PORT || 5000;

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

    const API_KEY = "AIzaSyB5DFOkee1HDwLN7LNQHPvC675obBc6sJI";

    const MODELS = [
      "gemini-2.5-flash",        // 🔥 main
      "gemini-2.0-flash-lite"    // 🛟 backup
    ];

    const prompt = `Context:\n${context}\n\nQuestion: ${question}`;

    // function to call a model
    const callModel = async (model) => {
      const URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

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

      if (!response.ok) {
        throw { status: response.status, data };
      }

      return data;
    };

    let result;

    // 🔥 STEP 1: Try main model
    try {
      result = await callModel(MODELS[0]);
      console.log("✅ Used MAIN model:", MODELS[0]);
      return res.json(result);
    } catch (err) {
      console.log("❌ MAIN model failed:", MODELS[0]);
      console.log("Error:", JSON.stringify(err.data, null, 2));
    }

    // ⏱️ STEP 2: wait before retry
    await new Promise(r => setTimeout(r, 2000));

    // 🔥 STEP 3: Try backup model
    try {
      result = await callModel(MODELS[1]);
      console.log("🛟 Used BACKUP model:", MODELS[1]);
      return res.json(result);
    } catch (err) {
      console.log("❌ BACKUP model also failed");
      console.log("Error:", JSON.stringify(err.data, null, 2));

      return res.status(500).json({
        error: "Both AI models failed",
        details: err.data
      });
    }

  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(PORT, () => {
  console.log(`server running on ${PORT}`);
});