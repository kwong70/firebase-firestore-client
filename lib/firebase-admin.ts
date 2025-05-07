import { initializeApp, getApp, getApps, cert } from "firebase-admin/app";
import {
  Firestore,
  getFirestore as getFirestoreAdmin,
} from "firebase-admin/firestore";

// Store initialized database instances
const databaseInstances: Record<string, Firestore> = {};

// Initialize Firebase Admin as a singleton
export function initializeFirebase() {
  try {
    // Check if we have the service account credentials
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT environment variable is not set"
      );
    }

    // Parse the service account JSON
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      throw new Error(
        "Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it's valid JSON."
      );
    }

    // Check for required fields in service account
    if (
      !serviceAccount.project_id ||
      !serviceAccount.private_key ||
      !serviceAccount.client_email
    ) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT is missing required fields (project_id, private_key, or client_email)"
      );
    }

    const firebaseApp =
      getApps().length === 0
        ? initializeApp({
            credential: cert(serviceAccount),
          })
        : getApp();


    return firebaseApp;
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error);
    throw error;
  }
}

// Get a Firestore instance for a specific database
export function getFirestore(databaseId: string = '(default)') {

  // Use as cache key
  const cacheKey = databaseId;

  // Check if we already have this database instance
  if (databaseInstances[cacheKey]) {
    console.log(
      `Using cached Firestore instance for database: ${cacheKey}`
    );
    return databaseInstances[cacheKey];
  }

  try {
    // Get the singleton Firebase app instance
    const app = initializeFirebase();

    // Create a new Firestore instance
    const firestoreInstance = getFirestoreAdmin(app, databaseId);

    // Cache the instance
    databaseInstances[cacheKey] = firestoreInstance;
    return firestoreInstance;
  } catch (error) {
    console.error(
      `Error getting Firestore database (${databaseId}):`,
      error
    );
    throw error;
  }
}

// Clear all cached database instances
export function clearFirestoreCache() {
  Object.keys(databaseInstances).forEach((key) => {
    delete databaseInstances[key];
  });
}
