import admin from "firebase-admin"

// Initialize Firebase Admin once
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

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })

      console.log("Firebase Admin initialized successfully")
    } catch (error) {
      console.error("Error initializing Firebase Admin:", error)
      throw error
    }
  }

  return admin.app()
}

// Get a Firestore instance for a specific database
export function getFirestore(databaseId?: string) {
  // Normalize database ID
  const normalizedDbId = databaseId && databaseId !== "(default)" ? databaseId : "(default)"

  try {
    // Make sure Firebase is initialized
    initializeFirebase()

    // Get a fresh Firestore instance
    const firestoreInstance = admin.firestore()

    // Configure for non-default database if needed
    if (normalizedDbId !== "(default)") {
      firestoreInstance.settings({
        databaseId: normalizedDbId,
      })
      console.log(`Created Firestore instance for database: ${normalizedDbId}`)
    } else {
      console.log("Created Firestore instance for default database")
    }

    return firestoreInstance
  } catch (error) {
    console.error(`Error getting Firestore database (${normalizedDbId}):`, error)

    // If we failed with a non-default database, try falling back to default
    if (normalizedDbId !== "(default)") {
      console.log("Falling back to default database due to error")
      return getFirestore("(default)")
    }

    // If we're already trying to get the default database and it failed, rethrow
    throw error
  }
}

// This function is no longer needed but kept for backward compatibility
export function clearFirestoreCache() {
  console.log("Cache clearing not needed - no cache is used")
  return
}
