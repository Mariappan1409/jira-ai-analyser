import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { searchEpic, getEpicStories, getAllEpics } from "../api/jira";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
// Corrected import path based on your folder structure
import { askGemini, buildEpicContext } from "../ai/gemini"; 

export default function Home() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [epic, setEpic] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [epics, setEpics] = useState([]);

  const [question, setQuestion] = useState("");
  // CHANGED: Now using an array to store chat history
  const [chatHistory, setChatHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const normalize = (res) => {
    const list =
      res?.issues ||
      res?.values ||
      res?.results ||
      [];

    return list.map((i) => i.issue || i);
  };

  const loadConfig = async () => {
    const snap = await getDoc(doc(db, "config", "jira"));

    if (snap.exists()) {
      const cfg = snap.data();
      setConfig(cfg);

      const all = await getAllEpics(cfg);
      setEpics(normalize(all));
    }
  };

  const search = async (selected) => {
    const key = selected || epic;
    if (!key) return;

    setLoading(true);
    // Reset chat when searching for a new epic
    setChatHistory([]);

    const epicData = await searchEpic(config, key);
    const stories = await getEpicStories(config, key);

    setData({
      epic: normalize(epicData)[0],
      stories: normalize(stories),
    });

    setLoading(false);
  };

  // FIXED AI LOGIC TO SUPPORT CHAT
  const askAI = async () => {
    if (!question || !data) return;

    const userMsg = question;
    setQuestion(""); // Clear input immediately
    
    // Add user question to chat UI immediately
    const newChat = [...chatHistory, { role: "user", text: userMsg }];
    setChatHistory(newChat);
    setAiLoading(true);

    try {
      // 1. Create the detailed context using your helper
      const epicContext = buildEpicContext(data.epic, data.stories);
      
      // 2. Build history string to maintain conversation flow
      const historyString = newChat
        .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.text}`)
        .join("\n");

      const fullContextWithHistory = `${epicContext}\n\nRecent Conversation:\n${historyString}`;

      // 3. Send to Gemini
      const response = await askGemini(fullContextWithHistory, userMsg);

      // 4. Update history with AI response
      setChatHistory([...newChat, { role: "ai", text: response }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setChatHistory([...newChat, { role: "ai", text: "Error: Failed to get response." }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/* HEADER */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <h1 className="text-xl font-semibold text-blue-600">
          Jira Analyzer
        </h1>

        <button
          onClick={() => navigate("/config")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Configure
        </button>
      </div>

      {!config && (
        <div className="flex items-center justify-center h-[80vh]">
          <button
            onClick={() => navigate("/config")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Connect Jira
          </button>
        </div>
      )}

      {config && (
        <div className="p-8 grid grid-cols-3 gap-6">

          {/* LEFT */}
          <div className="col-span-1 space-y-6">

            <div className="bg-white p-5 rounded-xl shadow">
              <h2 className="font-semibold mb-3">
                Search Issue / Epic
              </h2>

              <div className="flex gap-2">
                <input
                  value={epic || ""}
                  onChange={(e) => setEpic(e.target.value)}
                  placeholder="KAN-4"
                  className="flex-1 border p-2 rounded"
                />

                <button
                  onClick={() => search()}
                  className="px-4 bg-blue-600 text-white rounded"
                >
                  Search
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow h-[520px] overflow-y-auto">
              <h2 className="font-semibold mb-3">
                All Issues
              </h2>

              {epics.map((ep) => (
                <div
                  key={ep.key}
                  onClick={() => search(ep.key)}
                  className="p-3 border rounded-lg mb-2 cursor-pointer hover:bg-blue-50"
                >
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {ep.key}
                    </span>

                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {ep.fields?.issuetype?.name}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600">
                    {ep.fields?.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-span-2 space-y-6">

            {loading && (
              <div className="bg-white p-6 rounded-xl shadow">
                Loading...
              </div>
            )}

            {data && (
              <>
                <div className="bg-white p-6 rounded-xl shadow">
                  <h2 className="font-semibold text-lg">
                    {data.epic.key}
                  </h2>

                  <p className="text-gray-600">
                    {data.epic.fields.summary}
                  </p>
                </div>

                <div className="bg-white p-6 rounded-xl shadow">
                  <h2 className="font-semibold mb-4">
                    Stories
                  </h2>

                  {data.stories.map((story) => (
                    <div
                      key={story.key}
                      onClick={() =>
                        navigate(`/child/${story.key}`)
                      }
                      className="border p-4 rounded-lg mb-2 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">
                          {story.key}
                        </span>

                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {story.fields.status?.name}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600">
                        {story.fields.summary}
                      </p>
                    </div>
                  ))}
                </div>

                {/* UPDATED GEMINI SECTION FOR CHATTING */}
                <div className="bg-white p-6 rounded-xl shadow flex flex-col h-[500px]">
                  <h2 className="font-semibold mb-3">
                    AI Chatbot (Analyzing {data.epic.key})
                  </h2>

                  {/* MESSAGES AREA */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
                    {chatHistory.length === 0 && (
                      <p className="text-gray-400 text-center mt-10">Ask me anything about this Epic or its stories.</p>
                    )}
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                          <p className="text-xs font-bold mb-1 uppercase opacity-70">
                            {msg.role === 'user' ? 'You' : 'Gemini'}
                          </p>
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        </div>
                      </div>
                    ))}
                    {aiLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg animate-pulse text-gray-500 italic">
                          Gemini is typing...
                        </div>
                      </div>
                    )}
                  </div>

                  {/* INPUT AREA */}
                  <div className="flex gap-2 border-t pt-4">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && askAI()}
                      placeholder="Ask a follow-up question..."
                      className="flex-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      onClick={askAI}
                      disabled={aiLoading}
                      className={`px-4 bg-black text-white rounded ${aiLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}

          </div>

        </div>
      )}
    </div>
  );
}