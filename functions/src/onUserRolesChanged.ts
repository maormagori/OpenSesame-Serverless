import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const DB = admin.firestore();

export default functions.firestore
  .document("/users/{userId}")
  .onUpdate((change, context) => {
    const updateEvent = {
      updatedBy: context.auth?.uid ?? "Unknown",
      lastUpdateTime: admin.firestore.FieldValue.serverTimestamp(),
    };
    DB.collection("users")
      .doc(context.params.userId)
      .set(updateEvent, { merge: true });
  });
