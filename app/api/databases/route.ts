import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { initializeFirebase } from "@/lib/firebase-admin"

export async function GET() {
  try {
    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Get all available databases
    const projectId = admin.app().options.projectId

    if (!projectId) {
      throw new Error("Could not determine Firebase project ID")
    }

    // Use the Firebase Management API to list databases
    // Note: This requires the service account to have the Firebase Admin SDK Admin role
    const databases = [
        { id: "(defualt)" }, { id: "frank" }, { id: "frankfurt" } 
    ]

    return NextResponse.json({
      databases: databases.map((db) => ({
        id: db.id,
        name: db.id,
        // Extract just the database ID from the full path
        displayName: db.id,
      })),
    })
  } catch (error) {
    console.error("Error fetching databases:", error)

    // If we can't fetch databases, return at least the default one
    return NextResponse.json({
      databases: [{ id: "(default)", name: "Default Database", displayName: "Default Database" }],
      error: "Could not fetch all databases. Make sure your service account has sufficient permissions.",
    })
  }
}
