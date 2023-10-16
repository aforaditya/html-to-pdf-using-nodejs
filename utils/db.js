import firebase from 'firebase-admin' 
import serviceAccount from './key.json' assert { type: "json" }

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount)
   });

const db = firebase.firestore();

export async function get(collection, id){
    let resp = await db.collection(collection).doc(id.trim()).get()
    return resp.data()
}

export async function set(collection, id, data){
    await db.collection(collection).doc(id).set({...data})
}