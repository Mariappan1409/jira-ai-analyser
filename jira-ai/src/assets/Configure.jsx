import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Configure() {
  const navigate = useNavigate();

  const [config, setConfig] = useState({
    jiraUrl: "",
    email: "",
    apiKey: "",
    model: "gemini",
  });

  const handleChange = (e) => {
    setConfig({
      ...config,
      [e.target.name]: e.target.value,
    });
  };

  const saveConfig = () => {
    localStorage.setItem(
      "jiraConfig",
      JSON.stringify(config)
    );

    navigate("/analyze");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center">
      <div className="bg-white p-8 rounded shadow w-[500px]">
        <h1 className="text-2xl font-bold">
          Configure Jira
        </h1>

        <div className="mt-4 space-y-3">
          <input
            name="jiraUrl"
            placeholder="Jira URL"
            className="w-full border p-2 rounded"
            onChange={handleChange}
          />

          <input
            name="email"
            placeholder="Email"
            className="w-full border p-2 rounded"
            onChange={handleChange}
          />

          <input
            name="apiKey"
            placeholder="API Token"
            type="password"
            className="w-full border p-2 rounded"
            onChange={handleChange}
          />

          <button
            onClick={saveConfig}
            className="w-full bg-blue-600 text-white py-2 rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}