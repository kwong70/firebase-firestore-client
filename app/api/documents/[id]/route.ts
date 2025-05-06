import { NextResponse } from "next/server"
import { initializeFirebase, getFirestore } from "@/lib/firebase-admin"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collection")
    const databaseId = searchParams.get("database") || "(default)"

    console.log(`API: Updating document ${id} in collection: ${collectionId} in database: ${databaseId}`)

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { data } = body

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get the specified database
    const db = getFirestore(databaseId)
    const docRef = db.collection(collectionId).doc(id)

    // Use set with merge option instead of update to handle new fields
    await docRef.set(data, { merge: true })

    return NextResponse.json({
      id,
      success: true,
    })
  } catch (error) {
    console.error("Error updating document:", error)
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collection")
    const databaseId = searchParams.get("database") || "(default)"

    console.log(`API: Deleting document ${id} in collection: ${collectionId} in database: ${databaseId}`)

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 })
    }

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get the specified database
    const db = getFirestore(databaseId)
    const docRef = db.collection(collectionId).doc(id)

    await docRef.delete()

    return NextResponse.json({
      id,
      success: true,
    })
  } catch (error) {
    console.error("Error deleting document:", error)
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 })
  }
}
