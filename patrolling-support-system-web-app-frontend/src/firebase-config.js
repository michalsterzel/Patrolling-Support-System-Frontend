import { initializeApp } from "firebase/app";
import {getAuth} from "firebase/auth"
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Convert to use environment variables for these:
const firebaseConfig = {
  apiKey: "AIzaSyCDckqS3IrtzPJdkvKmd1GY-mvtX_4Orx4",
  authDomain: "patrollingsupportsystemproject.firebaseapp.com",
  databaseURL: "https://patrollingsupportsystemproject-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "patrollingsupportsystemproject",
  storageBucket: "patrollingsupportsystemproject.appspot.com",
  messagingSenderId: "88183134739",
  appId: "1:88183134739:web:c28c3c5188f9e27215bde6",
  measurementId: "G-299PYRZ3VG"
};


const app = initializeApp(firebaseConfig);

export const storage = getStorage(app)

export const database = getDatabase(app)

export const auth = getAuth(app)
