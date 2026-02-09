// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

// Firebase 初期化
const app = initializeApp(firebaseConfig);

// 使用するサービスをエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
