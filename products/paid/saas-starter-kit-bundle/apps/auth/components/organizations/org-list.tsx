"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Building2 } from "lucide-react"
import { toast } from "sonner"

export function CreateOrganization({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const createOrg = async () => {
    if (!name) return

    setLoading(true)
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-")
      const { data, error } = await supabase
        .from("organizations")
        .insert({ name, slug })
        .select()
        .single()

      if (error) throw error

      toast.success("Organization created successfully")
      setOpen(false)
      setName("")
      onCreated?.()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Organization
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Organization</DialogTitle>
          <DialogDescription>
            Create a new organization to manage your team and projects.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Organization Name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={createOrg} disabled={loading || !name}>
            {loading ? "Creating..." : "Create Organization"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function OrganizationList() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadOrgs = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false })

    if (!error) {
      setOrgs(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadOrgs()
  }, [])

  if (loading) return <div>Loading organizations...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Your Organizations</h2>
        <CreateOrganization onCreated={loadOrgs} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {orgs.map((org) => (
          <div
            key={org.id}
            className="flex items-center justify-between rounded-lg border p-4 shadow-sm"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">{org.name}</p>
                <p className="text-xs text-muted-foreground">{org.slug}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Manage
            </Button>
          </div>
        ))}

        {orgs.length === 0 && (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            No organizations found. Create one to get started.
          </div>
        )}
      </div>
    </div>
  )
}
