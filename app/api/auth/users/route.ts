import { NextResponse } from "next/server"
import admin from "firebase-admin"
import { initializeFirebase } from "@/lib/firebase-admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limitStr = searchParams.get("limit") || "50"
    const nextPageToken = searchParams.get("nextPageToken")
    const tenantId = searchParams.get("tenantId")
    const searchTerm = searchParams.get("search")
    const filterByEmail = searchParams.get("email")
    const filterByDisplayName = searchParams.get("displayName")
    const filterByPhone = searchParams.get("phone")
    const filterByStatus = searchParams.get("status") // "enabled" or "disabled"

    const limit = Number.parseInt(limitStr, 10)

    // Initialize Firebase Admin if not already initialized
    initializeFirebase()

    const auth = admin.auth()

    // If tenantId is provided, use tenant-specific auth
    const authInstance = tenantId ? auth.tenantManager().authForTenant(tenantId) : auth

    // List users with pagination
    const listUsersResult = await authInstance.listUsers(limit, nextPageToken || undefined)

    // Get users and apply filters
    let users = await Promise.all(
      listUsersResult.users.map(async (user) => {
        // Get user claims
        const customClaims = user.customClaims || {}

        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
          tenantId: user.tenantId,
          disabled: user.disabled,
          customClaims,
          metadata: {
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
          },
        }
      }),
    )

    // Apply filters on the server side
    if (filterByEmail) {
      users = users.filter((user) => user.email && user.email.includes(filterByEmail))
    }

    if (filterByDisplayName) {
      users = users.filter(
        (user) => user.displayName && user.displayName.toLowerCase().includes(filterByDisplayName.toLowerCase()),
      )
    }

    if (filterByPhone) {
      users = users.filter((user) => user.phoneNumber && user.phoneNumber.includes(filterByPhone))
    }

    if (filterByStatus) {
      const isDisabled = filterByStatus === "disabled"
      users = users.filter((user) => user.disabled === isDisabled)
    }

    // Apply search term if provided (searches across multiple fields)
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase()
      users = users.filter((user) => {
        return (
          (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
          (user.displayName && user.displayName.toLowerCase().includes(searchTermLower)) ||
          (user.uid && user.uid.toLowerCase().includes(searchTermLower)) ||
          (user.phoneNumber && user.phoneNumber.toLowerCase().includes(searchTermLower))
        )
      })
    }

    return NextResponse.json({
      users,
      hasMore: !!listUsersResult.pageToken,
      nextPageToken: listUsersResult.pageToken || null,
    })
  } catch (error) {
    console.error("Error fetching auth users:", error)
    return NextResponse.json({ error: "Failed to fetch auth users" }, { status: 500 })
  }
}
