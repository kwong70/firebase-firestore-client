import admin from "firebase-admin"

// Store initialized database instances
const databaseInstances: Record<string, admin.firestore.Firestore> = {}

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

export function getFirestore(databaseId?: string) {
  // Initialize Firebase Admin if not already initialized
  initializeFirebase()

  // Normalize database ID
  const normalizedDbId = databaseId && databaseId !== "(default)" ? databaseId : "(default)"

  // Check if we already have this database instance
  if (databaseInstances[normalizedDbId]) {
    return databaseInstances[normalizedDbId]
  }

  try {
    let firestoreInstance: admin.firestore.Firestore

    if (normalizedDbId === "(default)") {
      // Use default database
      console.log("Using default Firestore database")
      firestoreInstance = admin.firestore()
    } else {
      // Use specified database
      console.log(`Using Firestore database: ${normalizedDbId}`)

      // Create Firestore with the specific database
      const options: admin.firestore.Settings = {
        databaseId: normalizedDbId,
      }

      firestoreInstance = admin.firestore()
      firestoreInstance.settings(options)
    }

    // Cache the instance
    databaseInstances[normalizedDbId] = firestoreInstance
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
