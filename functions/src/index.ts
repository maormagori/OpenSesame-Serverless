import * as functions from "firebase-functions";
import { UserRecord } from "firebase-functions/v1/auth";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();
const db = getFirestore();

const usersCollection = db.collection("users");

exports.onNewUserSigned = functions.auth
  .user()
  .onCreate(async (user: UserRecord) => {
    await createUserRecordInFirestore(user);
    await informAliBabasOfANewUser(user);
  });

const createUserRecordInFirestore = async (user: UserRecord) => {
  const newUser = {
    displayName: user.displayName,
    email: user.email,
    roles: { aliBaba: false, thief: false },
  };

  const userDoc = usersCollection.doc(user.uid);

  await userDoc.set(newUser);
};

const informAliBabasOfANewUser = async (user: UserRecord) => {
  // const aliBabas = await usersCollection
  //   .where("roles.aliBaba", "==", true)
  //   .select("email")
  //   .get();
  // TODO: decide on a preferred informing method
};
