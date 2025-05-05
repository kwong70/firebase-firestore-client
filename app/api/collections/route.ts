import { NextResponse } from "next/server"
import { initializeFirebase, getFirestore } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const databaseId = searchParams.get("database") || "default"

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get the specified database
    const db = getFirestore(databaseId)
    const collections = await db.listCollections()
    const collectionIds = collections.map((collection) => collection.id)

    return NextResponse.json({ collections: collectionIds })
  } catch (error) {
    console.error("Error fetching collections:", error)
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 })
  }
}
