import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { initializeFirebase } from "@/lib/firebase-admin"

export async function GET() {
  try {
    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    const auth = admin.auth()
    const tenantManager = auth.tenantManager()

    // List all tenants
    const listTenantsResult = await tenantManager.listTenants()

    const tenants = listTenantsResult.tenants.map((tenant) => ({
      id: tenant.tenantId,
      displayName: tenant.displayName || tenant.tenantId,
    }))

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error("Error fetching tenants:", error)
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 })
  }
}
