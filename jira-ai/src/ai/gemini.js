export const askGemini = async (context, question) => {
  try {
    const res = await fetch("http://localhost:5000/api/ask-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ context, question }),
    });

    const data = await res.json();

    // Check if the backend returned an error object instead of Gemini data
    if (data.error) {
      console.error("Backend Error:", data.error);
      return `AI Error: ${data.error}`;
    }

    // Extract the text content safely
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return aiText || "AI was unable to generate a response.";
  } catch (err) {
    console.error("Frontend AI error:", err);
    return "Could not connect to the AI server. Is the backend running on port 5000?";
  }
};

// IMPROVED: This ensures the AI gets enough details to actually be useful
export const buildEpicContext = (epic, stories) => {
  if (!epic) return "No epic data found.";

  let ctx = `=== EPIC DETAILS ===\n`;
  ctx += `Key: ${epic.key}\nSummary: ${epic.fields.summary}\n`;
  ctx += `Description: ${epic.fields.description?.content?.[0]?.content?.[0]?.text || "No description"}\n\n`;

  ctx += `=== STORIES ===\n`;
  stories.forEach((s) => {
    const desc = s.fields?.description?.content?.[0]?.content?.[0]?.text || "No description";
    ctx += `- [${s.key}] ${s.fields.summary} (${s.fields.status?.name || "No Status"})\n`;
    ctx += `  Desc: ${desc}\n\n`;
  });

  return ctx;
};