import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration du projet "Widgets" (widgets-c0daf)
const widgetsConfig = {
    apiKey: "AIzaSyC0a8TBjgJgIme2t5OhodKRNG7uBUsvwF8",
    authDomain: "widgets-c0daf.firebaseapp.com",
    projectId: "widgets-c0daf",
    storageBucket: "widgets-c0daf.firebasestorage.app",
    messagingSenderId: "334895960508",
    appId: "1:334895960508:web:3d184dfa5f5bc6fe991bb9"
};

const getWidgetsDb = () => {
    const app = getApps().find(a => a.name === "WidgetsChat") 
        ? getApp("WidgetsChat") 
        : initializeApp(widgetsConfig, "WidgetsChat");
    return getFirestore(app);
};

export const widgetsDb = typeof window !== 'undefined' ? getWidgetsDb() : null as any;
