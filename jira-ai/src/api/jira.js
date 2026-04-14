const API = "http://localhost:5000";

export const getAllEpics = async (config) => {
  const res = await fetch("http://localhost:5000/jira/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: config.email,
      token: config.apiToken,
      url: config.jiraUrl,
      jql: "project = KAN ORDER BY created DESC"
    }),
  });

  return res.json();
};

const loadConfig = async () => {
  console.log("LOADING CONFIG");

  const docRef = doc(db, "config", "jira");
  const snap = await getDoc(docRef);

  console.log("SNAP", snap.exists());

  if (snap.exists()) {
    const cfg = snap.data();
    console.log("CONFIG", cfg);

    setConfig(cfg);

    const all = await getAllEpics(cfg);
    console.log("EPICS", all);

    const onlyEpics = (all?.issues || []).filter(
      (i) => i.fields.issuetype.name === "Epic"
    );

    setEpics(onlyEpics);
  }
};

export const searchEpic = async (config, key) => {
  const res = await fetch("http://localhost:5000/jira/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: config.email,
      token: config.apiToken,
      url: config.jiraUrl,
      jql: `key = ${key}`,
    }),
  });

  return res.json();
};
export const getEpicStories = async (config, key) => {
  const res = await fetch("http://localhost:5000/jira/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: config.email,
      token: config.apiToken,
      url: config.jiraUrl,
      jql: `parent = ${key} OR "Epic Link" = ${key}`,
    }),
  });

  return res.json();
};