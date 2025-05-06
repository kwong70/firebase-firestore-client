import admin from "firebase-admin"

// Store initialized database instances
const databaseInstances: Record<string, admin.firestore.Firestore> = {}

// Initialize Firebase Admin as a singleton
export function initializeFirebase() {
  try {
    // If the app is already initialized, return it
    if (admin.apps.length > 0) {
      return admin.app()
    }

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
      throw new Error("FIREBASE_SERVICE_ACCOUNT is missing required fields (project_id, private_key, or client_email)")
    }

    // Initialize the app with the default name
    const app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })

    console.log("Firebase Admin initialized successfully")
    return app
  } catch (error) {
    console.error("Error initializing Firebase Admin:", error)
    throw error
  }
}

// Get a Firestore instance for a specific database
export function getFirestore(databaseId?: string) {
  // Normalize database ID
  const normalizedDbId = databaseId && databaseId !== "(default)" ? databaseId : "(default)"

  // Use as cache key
  const cacheKey = normalizedDbId

  // Check if we already have this database instance
  if (databaseInstances[cacheKey]) {
    console.log(`Using cached Firestore instance for database: ${normalizedDbId}`)
    return databaseInstances[cacheKey]
  }

  try {
    // Get the singleton Firebase app instance
    const app = initializeFirebase()

    // Create a new Firestore instance
    const firestoreInstance = admin.firestore(app)

    // If it's not the default database, configure it with the specific database ID
    if (normalizedDbId !== "(default)") {
      console.log(`Configuring Firestore for database: ${normalizedDbId}`)
      firestoreInstance.settings({
        databaseId: normalizedDbId,
      })
    } else {
      console.log("Using default Firestore database")
    }

    // Cache the instance
    databaseInstances[cacheKey] = firestoreInstance
    return firestoreInstance
  } catch (error) {
    console.error(`Error getting Firestore database (${normalizedDbId}):`, error)
    throw error
  }
}

// Clear all cached database instances
export function clearFirestoreCache() {
  console.log("Clearing Firestore cache")
  Object.keys(databaseInstances).forEach((key) => {
    delete databaseInstances[key]
  })
}
