"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeApp, cert, getApps } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

export default function ServiceAccountAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [collections, setCollections] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const fileContent = await readFileAsText(file)
      const serviceAccount = JSON.parse(fileContent)

      // Initialize Firebase Admin SDK with service account
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount),
        })
      }

      // Get Firestore instance
      const db = getFirestore()

      // List collections to verify connection
      const collectionsSnapshot = await db.listCollections()
      const collectionIds = collectionsSnapshot.map((collection) => collection.id)

      setCollections(collectionIds)
      setIsAuthenticated(true)
      setError(null)
    } catch (err) {
      console.error("Authentication error:", err)
      setError("Failed to authenticate with service account. Please check the file format.")
    }
  }

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Firebase Admin Authentication</CardTitle>
        <CardDescription>Upload your Firebase service account JSON file to authenticate</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <label htmlFor="service-account" className="text-sm font-medium">
              Service Account JSON
            </label>
            <input
              id="service-account"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="cursor-pointer rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {isAuthenticated && (
            <div className="rounded-md bg-muted p-3">
              <h3 className="font-medium">Authentication Successful</h3>
              <p className="text-sm text-muted-foreground">Available Collections:</p>
              <ul className="mt-2 list-disc pl-5 text-sm">
                {collections.length > 0 ? (
                  collections.map((collection) => <li key={collection}>{collection}</li>)
                ) : (
                  <li>No collections found</li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
