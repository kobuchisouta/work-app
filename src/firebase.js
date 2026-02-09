

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";

// Firebase コンソールで取得した設定をここに貼り付けてください
const firebaseConfig = {
    apiKey: "AIzaSyBrqx5mKlwrQRWq28P5sh1SXwC3S7fc-bw",
    authDomain: "skill-link-9a112.firebaseapp.com",
    projectId: "skill-link-9a112",
    storageBucket: "skill-link-9a112.firebasestorage.app",
    messagingSenderId: "270190530596",
    appId: "1:270190530596:web:2bfc82027645e231d748b1",
    measurementId: "G-15XQ2FE4RN"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// ✅ これが重要：通信しやすい方式にする
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
