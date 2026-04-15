import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";

// Mocked dependencies to allow compilation in the preview environment
const db = {};
const getDoc = async () => ({ exists: () => false, data: () => ({}) });
const doc = () => ({});
const searchEpic = async () => [];
const getEpicStories = async () => [];
const buildFullJiraContext = () => "Mocked context";
const askGemini = async () => "Mocked AI response";

export function Child() {
  const { key } = useParams();

  const [story, setStory] = useState(null);
  const [fullData, setFullData] = useState(null);

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, [key]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory, aiLoading]);

  const normalize = (res) =>
    (res?.issues || res?.values || res?.results || []).map(
      (i) => i.issue || i
    );

  const loadData = async () => {
    const snap = await getDoc(doc(db, "config", "jira"));
    if (!snap.exists()) return;

    const cfg = snap.data();

    const res = await searchEpic(cfg, key);
    const currentStory = normalize(res)[0];

    setStory(currentStory);

    const epicKey =
      currentStory?.fields?.parent?.key ||
      currentStory?.fields?.customfield_10014;

    if (epicKey) {
      const epicRes = await searchEpic(cfg, epicKey);
      const storiesRes = await getEpicStories(cfg, epicKey);

      setFullData({
        epic: normalize(epicRes)[0],
        stories: normalize(storiesRes),
      });
    }
  };

  const handleAskAI = async () => {
    if (!question.trim()) return;

    const userMsg = question;
    setQuestion("");

    const newChat = [
      ...chatHistory,
      { role: "user", text: userMsg },
    ];

    setChatHistory(newChat);
    setAiLoading(true);

    try {
      const jiraContext = fullData
        ? buildFullJiraContext(fullData.epic, fullData.stories)
        : `Story: ${story?.key}
           ${story?.fields?.summary}`;

      const historyString = newChat
        .map(
          (m) =>
            `${m.role === "user" ? "User" : "AI"}: ${m.text}`
        )
        .join("\n");

      const fullPrompt = `Context:\n${jiraContext}\n\nConversation:\n${historyString}\n\nUser: ${userMsg}`;
      const response = await askGemini(fullPrompt, userMsg);

      setChatHistory([
        ...newChat,
        { role: "ai", text: response },
      ]);
    } catch (error) {
      console.error(error);
      setChatHistory([
        ...newChat,
        {
          role: "ai",
          text: "AI failed to respond",
        },
      ]);
    }

    setAiLoading(false);
  };

  if (!story)
    return (
      <div className="p-8 text-center text-gray-500">
        Loading story...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* STORY HEADER */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h1 className="text-2xl font-bold">
            {story.key}
          </h1>

          <p className="text-gray-600 mt-2">
            {story.fields?.summary}
          </p>

          <div className="mt-4 text-sm text-gray-500">
            Status: {story.fields?.status?.name}
          </div>

          <div className="mt-4 whitespace-pre-wrap text-gray-700">
            {
              story.fields?.description?.content?.[0]
                ?.content?.[0]?.text
            }
          </div>

          {/* ADDED ATTACHMENTS FOR CHILD COMPONENT */}
          {story.fields?.attachment?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">
                Attachments
              </h3>
              {story.fields.attachment.map((file) => (
                <a
                  key={file.id}
                  href={file.content}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-sm text-blue-600 hover:underline mb-1"
                >
                  📎 {file.filename}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* CHAT */}
        <div className="bg-white p-6 rounded-xl shadow flex flex-col h-[600px]">
          <h2 className="font-semibold mb-3">
            Gemini AI (Epic Context)
          </h2>

          {/* messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100"
                  }`}
                >
                  <div className="text-xs font-bold mb-1">
                    {msg.role === "user"
                      ? "You"
                      : "Gemini"}
                  </div>

                  <div className="whitespace-pre-wrap">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}

            {aiLoading && (
              <div className="text-gray-400 text-sm">
                Gemini thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* input */}
          <div className="flex gap-2 border-t pt-3">
            <input
              value={question}
              onChange={(e) =>
                setQuestion(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && handleAskAI()
              }
              placeholder="Ask about this story..."
              className="flex-1 border p-2 rounded"
            />

            <button
              onClick={handleAskAI}
              disabled={aiLoading}
              className="px-5 bg-black text-white rounded disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Added this default export so the file works correctly in standard setups.
// You can keep using it as "import { Child } from './child'" in your app!
export default Child;