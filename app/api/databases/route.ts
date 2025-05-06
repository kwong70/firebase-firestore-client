import { NextResponse } from "next/server"
import { initializeFirebase } from "@/lib/firebase-admin"

export async function GET() {
  try {
    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    // Since we can't reliably fetch all databases programmatically with the current service account,
    // we'll return a default database and let users add custom ones manually
    return NextResponse.json({
      databases: [
        { id: "(default)", displayName: "Default Database" },
        { id: "frankfurt", displayName: "Frankfurt" },
      ],
      message: "Only default database is available by default. Add custom databases manually.",
    })
  } catch (error) {
    console.error("Error in databases API:", error)
    return NextResponse.json({
      databases: [{ id: "(default)", displayName: "Default Database" }],
      error: "Could not initialize Firebase. Check your service account credentials.",
    })
  }
}
