"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Document {
  id: string
  data: Record<string, any>
}

interface EditDocumentModalProps {
  document: Document | null
  collectionId: string
  databaseId: string
  fieldNames: string[]
  onClose: () => void
  onSave: () => void
}

export function EditDocumentModal({
  document,
  collectionId,
  databaseId,
  fieldNames,
  onClose,
  onSave,
}: EditDocumentModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [documentId, setDocumentId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const isEditing = !!document

  useEffect(() => {
    if (document) {
      setFormData({ ...document.data })
      setDocumentId(document.id)
    } else {
      // Initialize with empty values for all known fields
      const initialData: Record<string, any> = {}
      fieldNames.forEach((field) => {
        initialData[field] = ""
      })
      setFormData(initialData)
      setDocumentId("")
    }
  }, [document, fieldNames])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleAddField = () => {
    setFormData((prev) => ({
      ...prev,
      ["newField" + Object.keys(prev).length]: "",
    }))
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      setError(null)

      const endpoint = isEditing
        ? `/api/documents/${documentId}?collection=${collectionId}&database=${databaseId}`
        : `/api/documents?collection=${collectionId}&database=${databaseId}`

      const method = isEditing ? "PUT" : "POST"

      console.log(`Saving document to ${endpoint} with method ${method}`, {
        id: documentId,
        data: formData,
      })

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: documentId,
          data: formData,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save document")
      }

      onSave()
    } catch (err) {
      console.error("Error saving document:", err)
      setError(err instanceof Error ? err.message : "Failed to save document")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Document" : "Add New Document"}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          {!isEditing && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="documentId" className="text-right">
                Document ID
              </Label>
              <Input
                id="documentId"
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                placeholder="Leave empty for auto-generated ID"
                className="col-span-3"
              />
            </div>
          )}

          {Object.keys(formData).map((field) => {
            const value = formData[field]
            const isObject = typeof value === "object" && value !== null && !(value instanceof Date)

            return (
              <div key={field} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={field} className="text-right">
                  {field}
                </Label>
                {isObject ? (
                  <Textarea
                    id={field}
                    value={JSON.stringify(value, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        handleInputChange(field, parsed)
                      } catch (err) {
                        // If it's not valid JSON, just store as string
                        handleInputChange(field, e.target.value)
                      }
                    }}
                    className="col-span-3 min-h-[100px]"
                  />
                ) : (
                  <Input
                    id={field}
                    value={value !== null && value !== undefined ? value : ""}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="col-span-3"
                  />
                )}
              </div>
            )
          })}

          <Button type="button" variant="outline" onClick={handleAddField} className="mt-2">
            Add Field
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
