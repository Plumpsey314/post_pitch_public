import { getFirestore } from 'firebase/firestore';
import {getApps, initializeApp} from "firebase/app";
import {getAuth} from "firebase/auth"
import "firebase/firestore";

const firebaseConfig = {
  // This should be populated with a different firebase database configuration
};

if(getApps.length){
  //TODO: Handle this case 
  throw Error("There is already an instance of our database running. Please contact the PostPitch developers if this issue persists.")
}

const app = initializeApp(firebaseConfig); // your firebase config here

const auth = getAuth(app)
const db = getFirestore()

const firebaseObj = {
  "db": db,
  "auth": auth
}

export default firebaseObj
