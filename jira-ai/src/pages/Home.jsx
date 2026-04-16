import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Removed firebase imports since we use localStorage now
import { searchEpic, getEpicStories } from "../api/jira";
import { askGemini, buildEpicContext } from "../ai/gemini";

export function Home() {
  const navigate = useNavigate();

  const [config, setConfig] = useState(null);
  const [epic, setEpic] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const normalize = (res) => {
    const list = res?.issues || res?.values || res?.results || [];
    return list.map((i) => i.issue || i);
  };

  const loadConfig = () => {
    // Read the saved details from the browser's local storage instead of Firebase
    const savedConfig = localStorage.getItem("jiraConfig");
    
    if (savedConfig) {
      try {
        const cfg = JSON.parse(savedConfig);
        setConfig(cfg);
      } catch (error) {
        console.error("Could not load config", error);
      }
    }
  };

  const search = async (selected) => {
    const key = selected || epic;
    if (!key) return;

    setLoading(true);
    setChatHistory([]);

    const epicData = await searchEpic(config, key);
    const stories = await getEpicStories(config, key);

    setData({
      epic: normalize(epicData)[0],
      stories: normalize(stories),
    });

    setLoading(false);
  };

  const askAI = async () => {
    if (!question || !data) return;

    const userMsg = question;
    setQuestion("");

    const newChat = [...chatHistory, { role: "user", text: userMsg }];
    setChatHistory(newChat);
    setAiLoading(true);

    try {
      const epicContext = buildEpicContext(data.epic, data.stories);
      const historyString = newChat
        .map(m => `${m.role === "user" ? "User" : "AI"}: ${m.text}`)
        .join("\n");

      const fullContextWithHistory = `${epicContext}\n\nRecent Conversation:\n${historyString}`;
      const response = await askGemini(fullContextWithHistory, userMsg);

      setChatHistory([...newChat, { role: "ai", text: response }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setChatHistory([...newChat, { role: "ai", text: "Error: Failed to get response." }]);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 px-6 md:px-10 py-5 bg-white/80 backdrop-blur shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-blue-600 tracking-tight">
          Jira Analyzer
        </h1>
        <button
          onClick={() => navigate("/config")}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 transition text-white rounded-xl shadow-md"
        >
          Configure
        </button>
      </div>

      {!config && (
        <div className="flex items-center justify-center h-[80vh]">
          <button
            onClick={() => navigate("/config")}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg text-lg"
          >
            Connect Jira
          </button>
        </div>
      )}

      {config && (
        <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT PANEL */}
          <div className="space-y-6 lg:col-span-1">
            {/* SEARCH */}
            <div className="bg-white/80 backdrop-blur p-5 rounded-2xl shadow-lg border">
              <h2 className="font-semibold mb-3 text-gray-700">
                Search Issue / Epic
              </h2>
              <div className="flex gap-2">
                <input
                  value={epic || ""}
                  onChange={(e) => setEpic(e.target.value)}
                  placeholder="KAN-4"
                  className="flex-1 border border-gray-300 focus:ring-2 focus:ring-blue-500 p-2 rounded-lg outline-none"
                />
                <button
                  onClick={() => search()}
                  className="px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="lg:col-span-2 space-y-6">
            {loading && (
              <div className="bg-white p-6 rounded-2xl shadow animate-pulse text-gray-500">
                Loading Jira Data...
              </div>
            )}

            {data && (
              <>
                {/* EPIC DETAILS */}
                <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border">
                  <h2 className="font-bold text-xl text-gray-800">
                    {data.epic?.key}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {data.epic?.fields?.summary}
                  </p>

                  {/* Epic Attachments */}
                  {data.epic?.fields?.attachment?.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-semibold text-gray-700 mb-2">
                        Attachments
                      </h3>
                      {data.epic.fields.attachment.map((file) => (
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

                {/* STORIES */}
                <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border">
                  <h2 className="font-semibold mb-4 text-gray-700">
                    Stories
                  </h2>
                  {data.stories.map((story) => (
                    <div
                      key={story.key}
                      onClick={() => navigate(`/child/${story.key}`)}
                      className="border p-4 rounded-xl mb-3 cursor-pointer transition hover:shadow-md hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">
                          {story.key}
                        </span>
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          {story.fields?.status?.name}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {story.fields?.summary}
                      </p>

                      {/* Story Attachments */}
                      {story.fields?.attachment?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          {story.fields.attachment.map((file) => (
                            <a
                              key={file.id}
                              href={file.content}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 block hover:underline mb-1"
                            >
                              📎 {file.filename}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* CHAT */}
                <div className="bg-white/90 backdrop-blur p-6 rounded-2xl shadow-lg border flex flex-col h-[450px]">
                  <h2 className="font-semibold mb-3 text-gray-700">
                    AI Chatbot ({data.epic?.key})
                  </h2>
                  <div className="flex-1 overflow-y-auto mb-4 space-y-3 pr-2">
                    {chatHistory.map((msg, i) => (
                      <div
                        key={i}
                        className={`p-3 rounded-xl max-w-[80%] ${
                          msg.role === "user"
                            ? "bg-blue-600 text-white ml-auto"
                            : "bg-gray-200 text-gray-800"
                        }`}
                      >
                        {msg.text}
                      </div>
                    ))}
                    {aiLoading && (
                      <p className="text-gray-500 text-sm">
                        Thinking...
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 border-t pt-3">
                    <input
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && askAI()}
                      placeholder="Ask something..."
                      className="flex-1 border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button
                      onClick={askAI}
                      className="px-5 bg-black hover:bg-gray-800 text-white rounded-lg"
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

export default Home;