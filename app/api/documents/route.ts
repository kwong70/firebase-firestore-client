import { NextResponse } from "next/server"
import type admin from "firebase-admin"
import { initializeFirebase, getFirestore } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collection")
    const databaseId = searchParams.get("database") || "(default)"
    const limitStr = searchParams.get("limit") || "50"
    const lastDocId = searchParams.get("lastDocId")
    const searchTerm = searchParams.get("search")
    const filterField = searchParams.get("filterField")
    const filterValue = searchParams.get("filterValue")
    const filterOperator = searchParams.get("filterOperator") || "=="
    const orderByField = searchParams.get("orderBy")
    const orderDirection = searchParams.get("orderDirection") || "asc"

    console.log(`API: Fetching documents for collection: ${collectionId} in database: ${databaseId}`)

    const limit = Number.parseInt(limitStr, 10)

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 })
    }

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get the specified database
    const db = getFirestore(databaseId)
    const collectionRef = db.collection(collectionId)

    // Get total count (this is not efficient for large collections)
    const countSnapshot = await collectionRef.count().get()
    const total = countSnapshot.data().count

    // Build query
    let query: admin.firestore.Query = collectionRef

    // Apply filters if provided
    if (filterField && filterValue !== null && filterValue !== undefined) {
      // Handle different filter operators
      switch (filterOperator) {
        case "==":
          query = query.where(filterField, "==", filterValue)
          break
        case "!=":
          query = query.where(filterField, "!=", filterValue)
          break
        case ">":
          query = query.where(filterField, ">", filterValue)
          break
        case ">=":
          query = query.where(filterField, ">=", filterValue)
          break
        case "<":
          query = query.where(filterField, "<", filterValue)
          break
        case "<=":
          query = query.where(filterField, "<=", filterValue)
          break
        case "array-contains":
          query = query.where(filterField, "array-contains", filterValue)
          break
        case "array-contains-any":
          query = query.where(filterField, "array-contains-any", filterValue.split(","))
          break
        case "in":
          query = query.where(filterField, "in", filterValue.split(","))
          break
        case "not-in":
          query = query.where(filterField, "not-in", filterValue.split(","))
          break
        default:
          query = query.where(filterField, "==", filterValue)
      }
    }

    // Apply ordering if provided
    if (orderByField) {
      query = query.orderBy(orderByField, orderDirection as "asc" | "desc")
    }

    // Apply limit
    query = query.limit(limit)

    // If lastDocId is provided, start after that document (for pagination)
    if (lastDocId) {
      const lastDocRef = db.collection(collectionId).doc(lastDocId)
      const lastDocSnapshot = await lastDocRef.get()

      if (lastDocSnapshot.exists) {
        query = query.startAfter(lastDocSnapshot)
      }
    }

    // Execute query
    const querySnapshot = await query.get()

    // Get documents
    let documents = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }))

    console.log(`API: Found ${documents.length} documents for collection: ${collectionId} in database: ${databaseId}`)

    // Apply client-side search if search term is provided
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      documents = documents.filter((doc) => {
        // Search in document ID
        if (doc.id.toLowerCase().includes(searchTermLower)) return true

        // Search in document data
        return Object.entries(doc.data).some(([key, value]) => {
          if (typeof value === "string") {
            return value.toLowerCase().includes(searchTermLower)
          }
          if (typeof value === "number" || typeof value === "boolean") {
            return value.toString().includes(searchTerm)
          }
          return false
        })
      })
    }

    // Determine if there are more documents to load
    const hasMore = documents.length === limit && documents.length < total

    return NextResponse.json({
      documents,
      total,
      hasMore,
      lastDocId: documents.length > 0 ? documents[documents.length - 1].id : null,
      database: databaseId,
    })
  } catch (error) {
    console.error("Error fetching documents:", error)
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionId = searchParams.get("collection")
    const databaseId = searchParams.get("database") || "(default)"

    console.log(`API: Creating document in collection: ${collectionId} in database: ${databaseId}`)

    if (!collectionId) {
      return NextResponse.json({ error: "Collection ID is required" }, { status: 400 })
    }

    const body = await request.json()
    const { id, data } = body

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get the specified database
    const db = getFirestore(databaseId)
    const collectionRef = db.collection(collectionId)

    let docRef
    if (id && id.trim() !== "") {
      // Use the provided ID
      docRef = collectionRef.doc(id)
      await docRef.set(data)
    } else {
      // Let Firestore generate an ID
      docRef = await collectionRef.add(data)
    }

    return NextResponse.json({
      id: docRef.id,
      success: true,
      database: databaseId,
    })
  } catch (error) {
    console.error("Error creating document:", error)
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 })
  }
}
