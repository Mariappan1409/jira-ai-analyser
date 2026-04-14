import { useEffect, useState } from "react";
import { getAccessToken, getCloudId, getIssues } from "../api/jira";

export default function Issue() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (code) {
      loadIssues(code);
    }
  }, []);

  const loadIssues = async (code) => {
    const tokenData = await getAccessToken(code);
    const token = tokenData.access_token;

    const cloudId = await getCloudId(token);

    const data = await getIssues(token, cloudId);
    setIssues(data);
  };

  return (
    <div>
      <h1>All Jira Issues</h1>

      {issues.map((issue) => (
        <div key={issue.id} style={{border:"1px solid #ccc",margin:"10px",padding:"10px"}}>
          
          <h3>{issue.fields.summary}</h3>

          <p>Type: {issue.fields.issuetype.name}</p>

          <p>Status: {issue.fields.status.name}</p>

          <p>Project: {issue.fields.project.name}</p>

          <p>Priority: {issue.fields.priority?.name}</p>

          <p>Assignee: {issue.fields.assignee?.displayName || "Unassigned"}</p>

          <p>Reporter: {issue.fields.reporter?.displayName}</p>

          <p>Created: {issue.fields.created}</p>

        </div>
      ))}
    </div>
  );
}