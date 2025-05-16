"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { initializeApp } from "firebase/app"
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, type User } from "firebase/auth"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import { Loader2 } from "lucide-react"

export default function GoogleAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [collections, setCollections] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [firebaseConfig, setFirebaseConfig] = useState<Record<string, string> | null>(null)

  // Initialize Firebase when config is available
  useEffect(() => {
    if (firebaseConfig) {
      const app = initializeApp(firebaseConfig)
      const auth = getAuth(app)

      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser)
        if (currentUser) {
          fetchCollections(app)
        }
      })

      return () => unsubscribe()
    }
  }, [firebaseConfig])

  const handleConfigSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const config = {
      apiKey: formData.get("apiKey") as string,
      authDomain: formData.get("authDomain") as string,
      projectId: formData.get("projectId") as string,
      storageBucket: formData.get("storageBucket") as string,
      messagingSenderId: formData.get("messagingSenderId") as string,
      appId: formData.get("appId") as string,
    }

    setFirebaseConfig(config)
  }

  const handleSignIn = async () => {
    if (!firebaseConfig) return

    setLoading(true)
    setError(null)

    try {
      const auth = getAuth()
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err) {
      console.error("Sign-in error:", err)
      setError("Failed to sign in with Google. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    const auth = getAuth()
    await signOut(auth)
    setCollections([])
  }

  const fetchCollections = async (app: any) => {
    try {
      const db = getFirestore(app)
      const collectionsSnapshot = await getDocs(collection(db, "dummy"))
        .then(() => getDocs(collection(db, "dummy"))) // This is a workaround to get all collections
        .catch(() => ({ docs: [] }))

      // Get parent collections
      const collectionRefs = db._firestoreClient._clientPool
        .getAll()
        .flatMap((client: any) => Object.keys(client._datastore._collectionParents || {}))

      setCollections(Array.from(new Set(collectionRefs)))
    } catch (err) {
      console.error("Error fetching collections:", err)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Firebase Google Authentication</CardTitle>
        <CardDescription>Sign in with Google to access your Firebase project</CardDescription>
      </CardHeader>
      <CardContent>
        {!firebaseConfig ? (
          <form onSubmit={handleConfigSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                API Key
              </label>
              <input
                id="apiKey"
                name="apiKey"
                type="text"
                required
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="AIzaSyC..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="authDomain" className="text-sm font-medium">
                Auth Domain
              </label>
              <input
                id="authDomain"
                name="authDomain"
                type="text"
                required
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="your-project.firebaseapp.com"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="projectId" className="text-sm font-medium">
                Project ID
              </label>
              <input
                id="projectId"
                name="projectId"
                type="text"
                required
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="your-project-id"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="storageBucket" className="text-sm font-medium">
                  Storage Bucket
                </label>
                <input
                  id="storageBucket"
                  name="storageBucket"
                  type="text"
                  required
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  placeholder="your-project.appspot.com"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="messagingSenderId" className="text-sm font-medium">
                  Messaging Sender ID
                </label>
                <input
                  id="messagingSenderId"
                  name="messagingSenderId"
                  type="text"
                  required
                  className="w-full rounded-md border border-input px-3 py-2 text-sm"
                  placeholder="123456789"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="appId" className="text-sm font-medium">
                App ID
              </label>
              <input
                id="appId"
                name="appId"
                type="text"
                required
                className="w-full rounded-md border border-input px-3 py-2 text-sm"
                placeholder="1:123456789:web:abcdef"
              />
            </div>
            <Button type="submit" className="w-full">
              Save Configuration
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {user.photoURL && (
                    <img
                      src={user.photoURL || "/placeholder.svg"}
                      alt={user.displayName || "User"}
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>

                {collections.length > 0 && (
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm font-medium">Available Collections:</p>
                    <ul className="mt-2 list-disc pl-5 text-sm">
                      {collections.map((collection) => (
                        <li key={collection}>{collection}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button variant="outline" onClick={handleSignOut} className="w-full">
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={handleSignIn} disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in with Google"
                )}
              </Button>
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
