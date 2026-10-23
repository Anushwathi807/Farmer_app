import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBPQKIv9hyVZRRwXm-D4w3J_WYblGl0eSg",
  authDomain: "farmer-app-c93e9.firebaseapp.com",
  projectId: "farmer-app-c93e9",
  storageBucket: "farmer-app-c93e9.firebasestorage.app",
  messagingSenderId: "25818831885",
  appId: "1:25818831885:web:9f2e961f3d35b37002c944"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInAnonymously, signOut };
