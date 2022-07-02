import "dotenv/config";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
  RulesTestContext,
} from "@firebase/rules-unit-testing";
import { setDoc, getDoc, updateDoc } from "@firebase/firestore";
import * as fs from "fs";
import firebase from "firebase/compat";

// Const
const PROJECT_ID = process.env.PROJECT_ID;
const THIEF_UID = "iamonlyathief";
const ALI_BABA_UID = "iamanalibaba";

let testEnv: RulesTestEnvironment;
let unauthenticatedUser: firebase.firestore.Firestore;
let thiefUser: RulesTestContext;
let thiefCtxDocs: { thiefUserDocRef: any; aliBabaUserDocRef: any };

let aliBabaUser: RulesTestContext;
let aliBabaCtxDocs: { aliBabaUserDocRef: any; thiefUserDocRef: any };

describe("rules", () => {
  before(async () => {
    console.log("creating test env");
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(__dirname + "/../firestore.rules", "utf-8"),
        host: "localhost",
        port: 8081,
      },
    });
    // Cleaning
    await testEnv.clearFirestore();

    // Adding mock data
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestoreContext = context.firestore();

      //  Creating a thief user
      const thiefDoc = firestoreContext.collection("users").doc(THIEF_UID);
      await setDoc(thiefDoc, {
        email: "test@test.com",
        name: "thief",
        roles: { thief: true, aliBaba: false },
      });

      //  Creating aliBaba user
      const aliBabaDoc = firestoreContext.collection("users").doc(ALI_BABA_UID);
      await setDoc(aliBabaDoc, {
        email: "test@test.com",
        name: "aliBaba",
        roles: { thief: true, aliBaba: true },
      });
    });

    // unauthenticated context creation
    unauthenticatedUser = testEnv.unauthenticatedContext().firestore();

    // authenticated contexts creation

    // thief contexts
    thiefUser = testEnv.authenticatedContext(THIEF_UID);
    thiefCtxDocs = {
      thiefUserDocRef: thiefUser.firestore().collection("users").doc(THIEF_UID),
      aliBabaUserDocRef: thiefUser
        .firestore()
        .collection("users")
        .doc(ALI_BABA_UID),
    };

    // ali baba context
    aliBabaUser = testEnv.authenticatedContext(ALI_BABA_UID);
    aliBabaCtxDocs = {
      thiefUserDocRef: aliBabaUser
        .firestore()
        .collection("users")
        .doc(THIEF_UID),
      aliBabaUserDocRef: aliBabaUser
        .firestore()
        .collection("users")
        .doc(ALI_BABA_UID),
    };
  });
  describe("unauthenticated user", () => {
    it("Reading without auth", async () => {
      const thiefUserDoc = unauthenticatedUser
        .collection("users")
        .doc(THIEF_UID);
      await assertFails(getDoc(thiefUserDoc));
    });
    it("Writing without auth", async () => {
      const newUserDoc = unauthenticatedUser
        .collection("users")
        .doc("newuseruid");
      await assertFails(setDoc(newUserDoc, { test: "I should fail" }));
    });
    it("Updating without auth", async () => {
      const thiefUserDoc = unauthenticatedUser
        .collection("users")
        .doc(THIEF_UID);
      await assertFails(updateDoc(thiefUserDoc, { name: "I should fail" }));
    });
  });

  // Authenticated user testing
  describe("authenticated user", () => {
    // Tests from thief user perspective
    it("Reading my own data without ali baba role", async () => {
      await assertSucceeds(getDoc(thiefCtxDocs.thiefUserDocRef));
    });
    it("Reading other users data without ali baba role", async () => {
      await assertFails(getDoc(thiefCtxDocs.aliBabaUserDocRef));
    });
    it("Updating my own data without ali baba role", async () => {
      await assertFails(
        updateDoc(thiefCtxDocs.thiefUserDocRef, {
          name: "new name",
          roles: { aliBaba: true },
        })
      );
    });
    it("Updating other user data without ali baba role", async () => {
      await assertFails(
        updateDoc(thiefCtxDocs.aliBabaUserDocRef, {
          roles: { aliBaba: true },
        })
      );
    });

    // Tests from ali baba user perspective
    it("Reading my own data with ali baba role", async () => {
      await assertSucceeds(getDoc(aliBabaCtxDocs.aliBabaUserDocRef));
    });
    it("Reading other user data with ali baba role", async () => {
      await assertSucceeds(getDoc(aliBabaCtxDocs.thiefUserDocRef));
    });
    it("Updating my own data with ali baba role", async () => {
      await assertSucceeds(
        updateDoc(aliBabaCtxDocs.aliBabaUserDocRef, {
          roles: { thief: true, aliBaba: true },
        })
      );
    });
    it("Updating other user data with ali baba role", async () => {
      await assertSucceeds(
        updateDoc(aliBabaCtxDocs.thiefUserDocRef, {
          roles: { thief: true },
        })
      );
    });
    it("Writing new fields with ali baba role", async () => {
      await assertFails(
        updateDoc(aliBabaCtxDocs.aliBabaUserDocRef, {
          new_field: "new_field_value",
        })
      );
    });
  });
});
