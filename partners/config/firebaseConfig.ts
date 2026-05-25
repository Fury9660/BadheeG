
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from "firebase/app";
// @ts-ignore
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyB7FV-3S_pAELSCQoy0HHu2YeQIqfjhdSY",
  authDomain: "badhee.firebaseapp.com",
  projectId: "badhee",
  storageBucket: "badhee.firebasestorage.app",
  messagingSenderId: "485011559568",
  appId: "1:485011559568:web:a1a451e5a54c33bcba7415",
  measurementId: "G-KF17RLFKFE"
};

let app, auth, db, storage;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  if (Platform.OS === 'web') {
    auth = getAuth(app);
  } else {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
} else {
  app = getApp();
  try {
    auth = getAuth(app);
  } catch (e) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  }
}

db = getFirestore(app);
storage = getStorage(app);


export { app, auth, db, firebaseConfig, storage };

