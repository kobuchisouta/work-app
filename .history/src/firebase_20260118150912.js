// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase コンソールで取得した設定をここに貼り付けてください
const firebaseConfig = {
    apiKey: "ここにapiKey",
    authDomain: "ここにauthDomain",
    projectId: "ここにprojectId",
    storageBucket: "ここにstorageBucket",
    messagingSenderId: "ここにmessagingSenderId",
    appId: "ここにappId",
};

// Firebase 初期化
const app = initializeApp(firebaseConfig);

// 使用するサービスをエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
