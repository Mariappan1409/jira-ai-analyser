import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAccessToken } from "../api/jira";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      login(code);
    }
  }, []);

  const login = async (code) => {
    try {
      const data = await getAccessToken(code);

      localStorage.setItem("jira_token", data.access_token);

      navigate("/issues");
    } catch (err) {
      console.error(err);
    }
  };

  return <div>Logging in with Jira...</div>;
}