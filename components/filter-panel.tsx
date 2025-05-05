"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Filter, ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FilterPanelProps {
  fieldNames: string[]
  onApplyFilter: (filters: FilterOptions) => void
  onClearFilters: () => void
}

export interface FilterOptions {
  field: string
  operator: string
  value: string
  orderBy: string
  orderDirection: "asc" | "desc"
}

export function FilterPanel({ fieldNames, onApplyFilter, onClearFilters }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [field, setField] = useState<string>("")
  const [operator, setOperator] = useState<string>("==")
  const [value, setValue] = useState<string>("")
  const [orderBy, setOrderBy] = useState<string>("")
  const [orderDirection, setOrderDirection] = useState<"asc" | "desc">("asc")

  useEffect(() => {
    if (fieldNames.length > 0 && !field) {
      setField(fieldNames[0])
    }
  }, [fieldNames, field])

  const handleApplyFilter = () => {
    onApplyFilter({
      field,
      operator,
      value,
      orderBy: orderBy === "none" ? "" : orderBy,
      orderDirection,
    })
  }

  const handleClearFilters = () => {
    setField(fieldNames.length > 0 ? fieldNames[0] : "")
    setOperator("==")
    setValue("")
    setOrderBy("")
    setOrderDirection("asc")
    onClearFilters()
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            <Filter className="h-4 w-4" />
            Filters
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        {isOpen && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      <CollapsibleContent className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md bg-muted/20">
          <div className="space-y-2">
            <Label htmlFor="field">Field</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger id="field">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {fieldNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="operator">Operator</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger id="operator">
                <SelectValue placeholder="Select operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="==">Equals (==)</SelectItem>
                <SelectItem value="!=">Not equals (!=)</SelectItem>
                <SelectItem value=">">Greater than (&gt;)</SelectItem>
                <SelectItem value=">=">Greater than or equal (&gt;=)</SelectItem>
                <SelectItem value="<">Less than (&lt;)</SelectItem>
                <SelectItem value="<=">Less than or equal (&lt;=)</SelectItem>
                <SelectItem value="array-contains">Array contains</SelectItem>
                <SelectItem value="array-contains-any">Array contains any</SelectItem>
                <SelectItem value="in">In</SelectItem>
                <SelectItem value="not-in">Not in</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="value">Value</Label>
            <Input id="value" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter value" />
            {(operator === "array-contains-any" || operator === "in" || operator === "not-in") && (
              <p className="text-xs text-muted-foreground">Separate multiple values with commas</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderBy">Order By</Label>
            <Select value={orderBy || "none"} onValueChange={setOrderBy}>
              <SelectTrigger id="orderBy">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {fieldNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="orderDirection">Order Direction</Label>
            <Select value={orderDirection} onValueChange={(value) => setOrderDirection(value as "asc" | "desc")}>
              <SelectTrigger id="orderDirection">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end">
            <Button onClick={handleApplyFilter}>Apply Filters</Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
