"use client"

import { useState, useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DocumentViewerProps {
  collectionId: string
  databaseId: string
  autoLoad?: boolean
}

interface Document {
  id: string
  data: Record<string, any>
}

export default function DocumentViewer({ collectionId, databaseId, autoLoad = true }: DocumentViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [lastDocId, setLastDocId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [dataLoaded, setDataLoaded] = useState(false)

  const fetchDocuments = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        if (!append) {
          setDocuments([])
          setLastDocId(null)
        }
      }
      setError(null)

      const url = new URL(`/api/documents`, window.location.origin)
      url.searchParams.append("collection", collectionId)
      url.searchParams.append("database", databaseId)
      url.searchParams.append("limit", "50")

      if (append && lastDocId) {
        url.searchParams.append("lastDocId", lastDocId)
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Failed to fetch documents: ${response.statusText}`)
      }

      const data = await response.json()

      if (append) {
        setDocuments((prev) => [...prev, ...data.documents])
      } else {
        setDocuments(data.documents)
      }

      setTotal(data.total)
      setHasMore(data.hasMore)
      setLastDocId(data.lastDocId)
      setDataLoaded(true)
    } catch (err) {
      console.error("Error fetching documents:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch documents")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Reset state when collection or database changes
  useEffect(() => {
    setDocuments([])
    setLastDocId(null)
    setDataLoaded(false)
    setError(null)

    // Only auto-load if specified
    if (autoLoad) {
      fetchDocuments()
    }
  }, [collectionId, databaseId, autoLoad])

  const handleLoadMore = () => {
    fetchDocuments(true)
  }

  if (!dataLoaded && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-muted-foreground text-center">No data loaded yet</p>
        <Button onClick={() => fetchDocuments()}>Load Documents</Button>
      </div>
    )
  }

  if (loading && documents.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-60 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (documents.length === 0) {
    return <p className="text-muted-foreground">No documents found in this collection.</p>
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-md overflow-x-auto">
        <pre className="text-sm">{JSON.stringify(documents, null, 2)}</pre>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {documents.length} of {total} documents
        </p>
        {hasMore && (
          <Button variant="outline" size="sm" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading More...
              </>
            ) : (
              "Load More"
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
