import * as functions from "firebase-functions";
import { UserRecord } from "firebase-functions/v1/auth";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

admin.initializeApp();
const DB = getFirestore();

const USERS_COLLECTION = DB.collection("users");

const createUserRecordInFirestore = async (user: UserRecord) => {
  const newUser = {
    displayName: user.displayName,
    email: user.email,
    roles: { aliBaba: false, thief: false },
  };

  const userDoc = USERS_COLLECTION.doc(user.uid);

  await userDoc.set(newUser);
};

const informAliBabasOfANewUser = async (user: UserRecord) => {
  const tokensCollectionSnapshot = await DB.collection("tokens").get();
  const tokens: Array<string> = tokensCollectionSnapshot.docs.map(
    (userTokenDoc) => userTokenDoc.data().token
  );

  const NEW_USER_MSG = {
    tokens: tokens,
    title: "A new thief wants to join the 40!",
    body: `Click here to decide ${
      user.displayName ? user.displayName + "'" : "hi"
    }s fate`,
    data: {
      new_uid: user.uid,
    },
    android: {
      notification: {
        clickAction: "OPEN_USERS_ACTIVITY",
      },
    },
  };

  if (tokens) {
    const notificationsResponse = await admin
      .messaging()
      .sendMulticast(NEW_USER_MSG);

    console.log(
      // eslint-disable-next-line max-len
      `${notificationsResponse.successCount}/${tokens.length} of notifications reached their destination`
    );
  }
};

export default functions.auth.user().onCreate(async (user: UserRecord) => {
  await createUserRecordInFirestore(user);
  await informAliBabasOfANewUser(user);
});
