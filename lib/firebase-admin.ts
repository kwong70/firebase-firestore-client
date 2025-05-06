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
      let serviceAccount
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      } catch (e) {
        throw new Error("Failed to parse FIREBASE_SERVICE_ACCOUNT. Make sure it's valid JSON.")
      }

      // Check for required fields in service account
      if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error(
          "FIREBASE_SERVICE_ACCOUNT is missing required fields (project_id, private_key, or client_email)",
        )
      }

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

  try {
    // Only use the database() method if we have a non-default database ID
    // The special "(default)" ID should use the default database
    if (databaseId && databaseId !== "(default)") {
      console.log(`Using non-default database: ${databaseId}`)
      return admin.firestore().database(`(${databaseId})`)
    }

    console.log("Using default database")
    return admin.firestore()
  } catch (error) {
    console.error(`Error getting Firestore database (${databaseId}):`, error)
    // Fall back to default database
    console.log("Falling back to default database due to error")
    return admin.firestore()
  }
}
