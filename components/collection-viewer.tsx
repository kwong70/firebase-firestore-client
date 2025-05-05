"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EditDocumentModal } from "@/components/edit-document-modal"
import { FilterPanel, type FilterOptions } from "./filter-panel"

interface CollectionViewerProps {
  collectionId: string
  databaseId: string
  autoLoad?: boolean
}

interface Document {
  id: string
  data: Record<string, any>
}

export default function CollectionViewer({ collectionId, databaseId, autoLoad = true }: CollectionViewerProps) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [hasMore, setHasMore] = useState(false)
  const [lastDocId, setLastDocId] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<FilterOptions | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  const [editingDocument, setEditingDocument] = useState<Document | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Function to fetch documents
  const fetchDocuments = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        if (!append) {
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

      if (searchTerm) {
        url.searchParams.append("search", searchTerm)
      }

      if (filters) {
        if (filters.field && filters.value) {
          url.searchParams.append("filterField", filters.field)
          url.searchParams.append("filterValue", filters.value)
          url.searchParams.append("filterOperator", filters.operator)
        }

        if (filters.orderBy) {
          url.searchParams.append("orderBy", filters.orderBy)
          url.searchParams.append("orderDirection", filters.orderDirection)
        }
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
    setFilters(null)
    setDataLoaded(false)
    setError(null)

    // Only auto-load if specified
    if (autoLoad) {
      fetchDocuments()
    }
  }, [collectionId, databaseId, autoLoad])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDocuments()
  }

  const getFieldNames = () => {
    const fieldSet = new Set<string>()
    documents.forEach((doc) => {
      Object.keys(doc.data).forEach((key) => fieldSet.add(key))
    })
    return Array.from(fieldSet)
  }

  const fieldNames = getFieldNames()

  const handleLoadMore = () => {
    fetchDocuments(true)
  }

  const handleEditDocument = (doc: Document) => {
    setEditingDocument(doc)
    setIsEditModalOpen(true)
  }

  const handleApplyFilter = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    fetchDocuments()
  }

  const handleClearFilters = () => {
    setFilters(null)
    fetchDocuments()
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
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSearch} className="flex justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">
              Showing {documents.length} of {total} documents
            </p>
            <Button
              onClick={() => {
                setEditingDocument(null)
                setIsEditModalOpen(true)
              }}
            >
              Add Document
            </Button>
          </div>
        </form>

        <FilterPanel fieldNames={fieldNames} onApplyFilter={handleApplyFilter} onClearFilters={handleClearFilters} />
      </div>

      {documents.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-muted-foreground">No documents found matching your criteria.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">ID</TableHead>
                  {fieldNames.map((field) => (
                    <TableHead key={field}>{field}</TableHead>
                  ))}
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.id}</TableCell>
                    {fieldNames.map((field) => (
                      <TableCell key={field} className="max-w-[300px] truncate">
                        {formatValue(doc.data[field])}
                      </TableCell>
                    ))}
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditDocument(doc)} className="h-8 w-8 p-0">
                        <span className="sr-only">Edit</span>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          <path d="m15 5 4 4" />
                        </svg>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore} className="min-w-[200px]">
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              `Load More (${documents.length}/${total})`
            )}
          </Button>
        </div>
      )}

      {isEditModalOpen && (
        <EditDocumentModal
          document={editingDocument}
          collectionId={collectionId}
          databaseId={databaseId}
          fieldNames={fieldNames}
          onClose={() => {
            setIsEditModalOpen(false)
            setEditingDocument(null)
          }}
          onSave={() => {
            setIsEditModalOpen(false)
            setEditingDocument(null)
            // Refresh the documents
            fetchDocuments()
          }}
        />
      )}
    </div>
  )
}

function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return ""
  }

  if (typeof value === "object") {
    if (value instanceof Date) {
      return value.toLocaleString()
    }
    return JSON.stringify(value)
  }

  return String(value)
}
