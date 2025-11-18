// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";   
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD6ATRiuZxjeO3egN81Y7mhjZGwsLE5daA",
  authDomain: "pokemonproject-457bb.firebaseapp.com",
  projectId: "pokemonproject-457bb",
  storageBucket: "pokemonproject-457bb.firebasestorage.app",
  messagingSenderId: "166589277336",
  appId: "1:166589277336:web:497fcdeab89bbfe4fddced",
  measurementId: "G-XR6HN9Q8Q3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
