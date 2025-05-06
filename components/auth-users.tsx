"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { UserFilterPanel, type UserFilterOptions } from "./user-filter-panel"

interface AuthUser {
  uid: string
  email: string
  displayName: string | null
  phoneNumber: string | null
  tenantId: string | null
  disabled: boolean
  customClaims: Record<string, any>
  metadata: {
    creationTime: string
    lastSignInTime: string
  }
}

interface Tenant {
  id: string
  displayName: string
}

interface AuthUsersProps {
  autoLoad?: boolean
}

export default function AuthUsers({ autoLoad = true }: AuthUsersProps) {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [hasMore, setHasMore] = useState(false)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<UserFilterOptions | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const tenantsLoaded = useRef(false)

  // Fetch tenants only once
  useEffect(() => {
    if (!tenantsLoaded.current) {
      tenantsLoaded.current = true

      const fetchTenants = async () => {
        try {
          setError(null)

          const response = await fetch(`/api/auth/tenants`)

          if (!response.ok) {
            throw new Error(`Failed to fetch tenants: ${response.statusText}`)
          }

          const data = await response.json()
          setTenants([{ id: "all", displayName: "All Tenants" }, ...data.tenants])
        } catch (err) {
          console.error("Error fetching tenants:", err)
          setError(err instanceof Error ? err.message : "Failed to fetch tenants")
        }
      }

      fetchTenants()
    }
  }, [])

  // Function to fetch users
  const fetchUsers = async (append = false) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
        if (!append) {
          setUsers([])
          setNextPageToken(null)
        }
      }
      setError(null)

      const url = new URL("/api/auth/users", window.location.origin)
      url.searchParams.append("limit", "50")

      if (selectedTenant && selectedTenant !== "all") {
        url.searchParams.append("tenantId", selectedTenant)
      }

      if (append && nextPageToken) {
        url.searchParams.append("nextPageToken", nextPageToken)
      }

      if (searchTerm) {
        url.searchParams.append("search", searchTerm)
      }

      if (filters) {
        if (filters.email) {
          url.searchParams.append("email", filters.email)
        }
        if (filters.displayName) {
          url.searchParams.append("displayName", filters.displayName)
        }
        if (filters.phone) {
          url.searchParams.append("phone", filters.phone)
        }
        if (filters.status && filters.status !== "all") {
          url.searchParams.append("status", filters.status)
        }
      }

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`)
      }

      const data = await response.json()

      if (append) {
        setUsers((prev) => [...prev, ...data.users])
      } else {
        setUsers(data.users)
      }

      setHasMore(data.hasMore)
      setNextPageToken(data.nextPageToken)
      setDataLoaded(true)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch users")
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial fetch when component mounts
  useEffect(() => {
    if (autoLoad && tenants.length > 0 && !dataLoaded) {
      fetchUsers()
    }
  }, [tenants, autoLoad, dataLoaded])

  // Handle tenant change
  useEffect(() => {
    if (dataLoaded) {
      setNextPageToken(null)
      fetchUsers()
    }
  }, [selectedTenant, dataLoaded])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers()
  }

  const handleLoadMore = () => {
    fetchUsers(true)
  }

  const handleTenantChange = (value: string) => {
    setSelectedTenant(value === "all" ? null : value)
  }

  const toggleUserExpanded = (uid: string) => {
    const newExpandedUsers = new Set(expandedUsers)
    if (newExpandedUsers.has(uid)) {
      newExpandedUsers.delete(uid)
    } else {
      newExpandedUsers.add(uid)
    }
    setExpandedUsers(newExpandedUsers)
  }

  const handleApplyFilter = (newFilters: UserFilterOptions) => {
    setFilters(newFilters)
    fetchUsers()
  }

  const handleClearFilters = () => {
    setFilters(null)
    fetchUsers()
  }

  if (!dataLoaded && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <p className="text-muted-foreground text-center">No data loaded yet</p>
        <Button onClick={() => fetchUsers()}>Load Users</Button>
      </div>
    )
  }

  if (loading && users.length === 0) {
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
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground hidden md:block">Showing {users.length} users</p>
            <Select value={selectedTenant || "all"} onValueChange={handleTenantChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Tenant" />
              </SelectTrigger>
              <SelectContent>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>

        <UserFilterPanel onApplyFilter={handleApplyFilter} onClearFilters={handleClearFilters} />
      </div>

      {users.length === 0 ? (
        <div className="text-center p-8 border rounded-md">
          <p className="text-muted-foreground">No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="border rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="w-[180px]">UID</TableHead>
                  <TableHead className="w-[200px]">Email</TableHead>
                  <TableHead className="w-[180px]">Display Name</TableHead>
                  <TableHead className="w-[150px]">Phone</TableHead>
                  <TableHead className="w-[150px]">Tenant ID</TableHead>
                  <TableHead className="w-[180px]">Created</TableHead>
                  <TableHead className="w-[180px]">Last Sign In</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <Collapsible
                    key={user.uid}
                    open={expandedUsers.has(user.uid)}
                    onOpenChange={() => toggleUserExpanded(user.uid)}
                    asChild
                  >
                    <>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              {expandedUsers.has(user.uid) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                              <span className="sr-only">Toggle user details</span>
                            </Button>
                          </CollapsibleTrigger>
                        </TableCell>
                        <TableCell className="font-medium truncate">{user.uid}</TableCell>
                        <TableCell className="truncate">{user.email}</TableCell>
                        <TableCell className="truncate">{user.displayName || "-"}</TableCell>
                        <TableCell className="truncate">{user.phoneNumber || "-"}</TableCell>
                        <TableCell className="truncate">{user.tenantId || "-"}</TableCell>
                        <TableCell className="truncate">
                          {new Date(user.metadata.creationTime).toLocaleString()}
                        </TableCell>
                        <TableCell className="truncate">
                          {new Date(user.metadata.lastSignInTime).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              user.disabled ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                            }`}
                          >
                            {user.disabled ? "Disabled" : "Active"}
                          </span>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <TableRow>
                          <TableCell colSpan={9} className="bg-muted/30 p-4">
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Custom Claims</h4>
                              {Object.keys(user.customClaims || {}).length === 0 ? (
                                <p className="text-sm text-muted-foreground">No custom claims found for this user.</p>
                              ) : (
                                <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto">
                                  {JSON.stringify(user.customClaims, null, 2)}
                                </pre>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
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
              "Load More Users"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
