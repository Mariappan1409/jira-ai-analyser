export const buildFullJiraContext = (epic, stories) => {
  if (!epic) return "No data available.";

  let context = "SYSTEM ROLE: You are an expert Jira Analyst. Use the following data to answer the user.\n\n";
  
  // =========================
  // EPIC DETAILS
  // =========================
  context += `=== EPIC DETAILS ===\n`;
  context += `ID: ${epic.key}\n`;
  context += `Summary: ${epic.fields.summary}\n`;
  context += `Status: ${epic.fields.status?.name || "N/A"}\n`;
  context += `Description: ${epic.fields.description?.content?.[0]?.content?.[0]?.text || "No description provided."}\n`;

  // ✅ EPIC ATTACHMENTS
  if (epic.fields?.attachment?.length > 0) {
    context += `Attachments:\n`;
    epic.fields.attachment.forEach((file, i) => {
      context += `  - ${file.filename} (${file.mimeType || "file"})\n`;
    });
  } else {
    context += `Attachments: None\n`;
  }

  context += `\n`;

  // =========================
  // STORIES
  // =========================
  context += `=== STORIES IN THIS EPIC ===\n`;

  stories.forEach((s, index) => {
    const storyDesc =
      s.fields?.description?.content?.[0]?.content?.[0]?.text ||
      "No description.";

    context += `${index + 1}. [${s.key}] ${s.fields.summary}\n`;
    context += `   Status: ${s.fields.status?.name}\n`;
    context += `   Assignee: ${s.fields.assignee?.displayName || "Unassigned"}\n`;
    context += `   Description: ${storyDesc}\n`;

    // ✅ STORY ATTACHMENTS
    if (s.fields?.attachment?.length > 0) {
      context += `   Attachments:\n`;
      s.fields.attachment.forEach((file) => {
        context += `     - ${file.filename} (${file.mimeType || "file"})\n`;
      });
    } else {
      context += `   Attachments: None\n`;
    }

    context += `\n`;
  });

  return context;
};