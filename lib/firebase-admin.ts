import admin from "firebase-admin"

let firebaseApp: admin.app.App

export function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      // Check if we have the service account credentials
      if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not set")
      }

      // Parse the service account JSON
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)

      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })

      console.log("Firebase Admin initialized successfully")
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error)
      throw error
    }
  } else {
    firebaseApp = admin.app()
  }

  return firebaseApp
}

export function getFirestore(databaseId?: string) {
  initializeFirebase()

  if (databaseId && databaseId !== "default") {
    return admin.firestore().database(databaseId)
  }

  return admin.firestore()
}
