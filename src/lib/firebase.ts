import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyD-bGtWDy2diw9yA8qDv7L-KjBk-cZgqQE",
  projectId: "ipjuon",
  storageBucket: "ipjuon.firebasestorage.app",
  messagingSenderId: "371887948376",
  appId: "1:371887948376:android:b1e17940eece1ae5c4402d"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);