import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQSoxzOHKObfKGLV1UnPXWJsFA4PcFHu0",
  authDomain: "jira-ai-analyser.firebaseapp.com",
  projectId: "jira-ai-analyser",
  storageBucket: "jira-ai-analyser.firebasestorage.app",
  messagingSenderId: "791551960488",
  appId: "1:791551960488:web:208f08ac8dffc75e02a99d"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);