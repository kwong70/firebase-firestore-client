"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import CollectionViewer from "@/components/collection-viewer"
import DocumentViewer from "@/components/document-viewer"
import AuthUsers from "@/components/auth-users"
import { DatabaseSelector } from "@/components/database-selector"

export default function Home() {
  const [collections, setCollections] = useState<string[]>([])
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [selectedDatabase, setSelectedDatabase] = useState<string>("(default)")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shouldFetchData, setShouldFetchData] = useState(false)

  // Load selected database from localStorage
  useEffect(() => {
    const savedDatabase = localStorage.getItem("selected-database")
    if (savedDatabase) {
      setSelectedDatabase(savedDatabase)
    }
  }, [])

  // Save selected database to localStorage
  useEffect(() => {
    localStorage.setItem("selected-database", selectedDatabase)
  }, [selectedDatabase])

  const fetchCollections = useCallback(async () => {
    if (!shouldFetchData) return

    try {
      setLoading(true)
      setError(null)
      setCollections([])
      setSelectedCollection(null)

      const url = new URL("/api/collections", window.location.origin)
      url.searchParams.append("database", selectedDatabase)

      const response = await fetch(url.toString())
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Failed to fetch collections: ${response.statusText}`)
      }

      setCollections(data.collections)

      if (data.collections.length > 0) {
        setSelectedCollection(data.collections[0])
      }
    } catch (err) {
      console.error("Error fetching collections:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch collections")
      setCollections([])
    } finally {
      setLoading(false)
    }
  }, [selectedDatabase, shouldFetchData])

  // Only fetch collections when database changes AND shouldFetchData is true
  useEffect(() => {
    if (shouldFetchData) {
      fetchCollections()
    }
  }, [selectedDatabase, shouldFetchData, fetchCollections])

  const handleCollectionSelect = (collection: string) => {
    setSelectedCollection(collection)
  }

  const handleDatabaseChange = (database: string) => {
    setSelectedDatabase(database)
    // Reset error when changing database
    setError(null)
    // When database changes, we should fetch data
    setShouldFetchData(true)
  }

  const handleLoadData = () => {
    setShouldFetchData(true)
  }

  const handleRetry = () => {
    setError(null)
    setShouldFetchData(true)
  }

  return (
    <main className="container mx-auto p-4 max-w-[95%] 2xl:max-w-[90%]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Firebase Firestore Explorer</h1>
        <DatabaseSelector selectedDatabase={selectedDatabase} onDatabaseChange={handleDatabaseChange} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="w-fit" onClick={handleRetry}>
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="collections">
        <TabsList className="mb-4">
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="auth">Auth Users</TabsTrigger>
        </TabsList>

        <TabsContent value="collections">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle>Collections</CardTitle>
                <CardDescription>
                  Database: {selectedDatabase === "(default)" ? "Default" : selectedDatabase}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!shouldFetchData ? (
                  <div className="flex flex-col items-center justify-center py-8 space-y-4">
                    <p className="text-muted-foreground text-center">No data loaded yet</p>
                    <Button onClick={handleLoadData}>Load Collections</Button>
                  </div>
                ) : loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : collections.length === 0 ? (
                  <p className="text-muted-foreground">No collections found</p>
                ) : (
                  <div className="space-y-2">
                    {collections.map((collection) => (
                      <Button
                        key={collection}
                        variant={selectedCollection === collection ? "default" : "outline"}
                        className="w-full justify-start"
                        onClick={() => handleCollectionSelect(collection)}
                      >
                        {collection}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>
                  {selectedCollection ? `Collection: ${selectedCollection}` : "Select a collection"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!shouldFetchData ? (
                  <p className="text-muted-foreground">Please load collections first</p>
                ) : loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : !selectedCollection ? (
                  <p className="text-muted-foreground">Please select a collection to view its documents</p>
                ) : (
                  <Tabs defaultValue="table">
                    <TabsList className="mb-4">
                      <TabsTrigger value="table">Table View</TabsTrigger>
                      <TabsTrigger value="json">JSON View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="table">
                      <CollectionViewer
                        collectionId={selectedCollection}
                        databaseId={selectedDatabase}
                        autoLoad={false}
                        key={`${selectedDatabase}-${selectedCollection}`}
                      />
                    </TabsContent>
                    <TabsContent value="json">
                      <DocumentViewer
                        collectionId={selectedCollection}
                        databaseId={selectedDatabase}
                        autoLoad={false}
                        key={`${selectedDatabase}-${selectedCollection}`}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="auth">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Users</CardTitle>
              <CardDescription>View and manage Firebase Authentication users across all tenants</CardDescription>
            </CardHeader>
            <CardContent>
              <AuthUsers autoLoad={false} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
