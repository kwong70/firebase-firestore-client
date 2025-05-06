"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Database, Loader2 } from "lucide-react"

interface IDatabase {
  id: string
  displayName: string
}

interface DatabaseSelectorProps {
  selectedDatabase: string
  onDatabaseChange: (database: string) => void
}

export function DatabaseSelector({ selectedDatabase, onDatabaseChange }: DatabaseSelectorProps) {
  const [databases, setDatabases] = useState<IDatabase[]>([{ id: "(default)", displayName: "Default Database" }])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDatabaseId, setNewDatabaseId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load databases from localStorage and API
  useEffect(() => {
    const loadDatabases = async () => {
      try {
        setLoading(true)
        setError(null)

        // First, load from localStorage
        const savedDatabases = localStorage.getItem("firestore-databases")
        let localDatabases: IDatabase[] = []

        if (savedDatabases) {
          try {
            const parsed = JSON.parse(savedDatabases)
            if (Array.isArray(parsed) && parsed.length > 0) {
              localDatabases = parsed
            }
          } catch (e) {
            console.error("Error parsing saved databases:", e)
          }
        }

        // Then try to fetch from API
        try {
          const response = await fetch("/api/databases")

          if (response.ok) {
            const data = await response.json()

            if (data.databases && data.databases.length > 0) {
              // Merge API databases with local ones, preferring local names
              const apiDatabases = data.databases

              // Create a map of existing local databases by ID
              const localDbMap = new Map(localDatabases.map((db) => [db.id, db]))

              // Add API databases that aren't in local storage
              for (const apiDb of apiDatabases) {
                if (!localDbMap.has(apiDb.id)) {
                  localDatabases.push(apiDb)
                }
              }

              if (data.error) {
                setError(data.error)
              }
            }
          }
        } catch (err) {
          console.error("Error fetching databases from API:", err)
          // Continue with local databases
        }

        // Ensure default database is always present
        if (!localDatabases.some((db) => db.id === "(default)")) {
          localDatabases.unshift({ id: "(default)", displayName: "Default Database" })
        }

        setDatabases(localDatabases)

        // Save the merged list back to localStorage
        localStorage.setItem("firestore-databases", JSON.stringify(localDatabases))
      } catch (err) {
        console.error("Error loading databases:", err)
        setError("Failed to load databases. Using default database.")
      } finally {
        setLoading(false)
      }
    }

    loadDatabases()
  }, [])

  // Add custom database
  const handleAddDatabase = () => {
    if (newDatabaseId && !databases.some((db) => db.id === newDatabaseId)) {
      // Remove any parentheses from the database ID to ensure consistent format
      const cleanId = newDatabaseId.replace(/[()]/g, "")

      const newDatabase = {
        id: cleanId,
        displayName: cleanId,
      }

      const updatedDatabases = [...databases, newDatabase]
      setDatabases(updatedDatabases)

      // Save to localStorage
      localStorage.setItem("firestore-databases", JSON.stringify(updatedDatabases))

      setNewDatabaseId("")
      setIsAddDialogOpen(false)

      // Select the newly added database
      onDatabaseChange(cleanId)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4 text-muted-foreground" />
        <Select value={selectedDatabase} onValueChange={onDatabaseChange}>
          <SelectTrigger className="w-[200px]">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              <SelectValue placeholder="Select Database" />
            )}
          </SelectTrigger>
          <SelectContent>
            {databases.map((db) => (
              <SelectItem key={db.id} value={db.id}>
                {db.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add Database</span>
        </Button>
      </div>

      {error && <p className="text-xs text-amber-600 max-w-[300px]">{error}</p>}

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Firestore Database</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="databaseId">Database ID</Label>
              <Input
                id="databaseId"
                value={newDatabaseId}
                onChange={(e) => setNewDatabaseId(e.target.value)}
                placeholder="Enter database ID"
              />
              <p className="text-xs text-muted-foreground">
                Enter the ID of the Firestore database you want to connect to. Do not include parentheses.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddDatabase} disabled={!newDatabaseId}>
              Add Database
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
