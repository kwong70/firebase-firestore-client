import admin from "firebase-admin"

// Store initialized app instances
const appInstances: Record<string, admin.app.App> = {}
// Store initialized database instances
const databaseInstances: Record<string, admin.firestore.Firestore> = {}

export function initializeFirebase(databaseId?: string) {
  // Normalize database ID for use as a key
  const appName = databaseId && databaseId !== "(default)" ? `app-${databaseId}` : "default"

  // Check if we already have an app instance for this database
  if (appInstances[appName]) {
    return appInstances[appName]
  }

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
      throw new Error("FIREBASE_SERVICE_ACCOUNT is missing required fields (project_id, private_key, or client_email)")
    }

    // Initialize a new app instance with a unique name
    let app: admin.app.App

    if (appName === "default" && admin.apps.length > 0) {
      // Use the default app if it exists
      app = admin.app()
    } else {
      // Create a new app instance with the specified name
      app = admin.initializeApp(
        {
          credential: admin.credential.cert(serviceAccount),
        },
        appName,
      )
    }

    // Store the app instance
    appInstances[appName] = app

    console.log(`Firebase Admin initialized successfully for ${appName}`)
    return app
  } catch (error) {
    console.error(`Error initializing Firebase Admin for ${appName}:`, error)
    throw error
  }
}

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
    // Initialize the appropriate Firebase app
    const app = initializeFirebase(normalizedDbId)

    let firestoreInstance: admin.firestore.Firestore

    if (normalizedDbId === "(default)") {
      // Use default database
      console.log("Initializing default Firestore database")
      firestoreInstance = admin.firestore(app)
    } else {
      // Use specified database
      console.log(`Initializing Firestore database: ${normalizedDbId}`)

      // Create Firestore with the specific database
      firestoreInstance = admin.firestore(app)

      // Configure for the specific database
      firestoreInstance.settings({
        databaseId: normalizedDbId,
      })
    }

    // Cache the instance
    databaseInstances[cacheKey] = firestoreInstance
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

// Clear all cached instances - useful for testing
export function clearFirestoreCache() {
  console.log("Clearing Firestore cache")
  Object.keys(databaseInstances).forEach((key) => {
    delete databaseInstances[key]
  })
}
