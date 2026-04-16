import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Config() {
  const navigate = useNavigate();

  const [jiraUrl, setJiraUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = () => {
    // Read the saved details from the browser's local storage
    const savedConfig = localStorage.getItem("jiraConfig");

    if (savedConfig) {
      try {
        const data = JSON.parse(savedConfig);
        setJiraUrl(data.jiraUrl || "");
        setEmail(data.email || "");
        setApiToken(data.apiToken || "");
      } catch (error) {
        console.error("Could not load config", error);
      }
    }

    setLoaded(true);
  };

  const save = () => {
    // Save the details to the browser's local storage
    localStorage.setItem("jiraConfig", JSON.stringify({
      jiraUrl,
      email,
      apiToken,
    }));

    navigate("/");
  };

  if (!loaded) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow w-[420px]">

        <h2 className="text-xl font-semibold mb-1">
          Configure Jira
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Update your Jira connection
        </p>

        {/* Current connected */}
        {email && (
          <div className="bg-blue-50 border border-blue-200 p-3 rounded mb-4">
            <p className="text-sm font-medium">
              Currently Connected
            </p>

            <p className="text-xs text-gray-600">
              {email}
            </p>

            <p className="text-xs text-gray-500">
              {jiraUrl}
            </p>
          </div>
        )}

        <input
          placeholder="Jira URL"
          value={jiraUrl}
          className="w-full border p-2 mb-3 rounded"
          onChange={(e) => setJiraUrl(e.target.value)}
        />

        <input
          placeholder="Email"
          value={email}
          className="w-full border p-2 mb-3 rounded"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="API Token"
          value={apiToken}
          className="w-full border p-2 mb-4 rounded"
          onChange={(e) => setApiToken(e.target.value)}
        />

        <button
          onClick={save}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          Save Configuration
        </button>

        <button
          onClick={() => navigate("/")}
          className="w-full mt-2 border py-2 rounded"
        >
          Cancel
        </button>

      </div>
    </div>
  );
}