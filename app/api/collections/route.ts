import { NextResponse } from "next/server"
import { initializeFirebase, getFirestore, clearFirestoreCache } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("database") || "(default)"

    console.log(`API: Fetching collections for database: ${databaseId}`)

    // Clear cache to ensure we're getting fresh data
    clearFirestoreCache()

    // Initialize Firebase Admin if not already initialized
    initializeFirebase(databaseId)

    // Get the specified database
    const db = getFirestore(databaseId)

    try {
      // Force a new request to Firestore
      const collections = await db.listCollections()
      const collectionIds = collections.map((collection) => collection.id)

      console.log(`API: Found ${collectionIds.length} collections for database: ${databaseId}`)

      return NextResponse.json(
        {
          collections: collectionIds,
          database: databaseId,
        },
        {
          headers: {
            // Prevent caching
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      )
    } catch (error) {
      console.error(`Error listing collections for database ${databaseId}:`, error)
      return NextResponse.json(
        {
          error: `Failed to list collections for database ${databaseId}. The database may not exist or your service account may not have access.`,
          collections: [],
          database: databaseId,
        },
        { status: 404 },
      )
    }
  } catch (error) {
    console.error("Error in collections API:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize Firebase. Check your service account credentials.",
        collections: [],
      },
      { status: 500 },
    )
  }
}
