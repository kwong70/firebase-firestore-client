import { NextResponse } from "next/server"
import { initializeFirebase, getFirestore } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("database") || "(default)"

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get the specified database
    const db = getFirestore(databaseId)

    try {
      const collections = await db.listCollections()
      const collectionIds = collections.map((collection) => collection.id)

      return NextResponse.json({ collections: collectionIds })
    } catch (error) {
      console.error(`Error listing collections for database ${databaseId}:`, error)
      return NextResponse.json(
        {
          error: `Failed to list collections for database ${databaseId}. The database may not exist or your service account may not have access.`,
          collections: [],
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
