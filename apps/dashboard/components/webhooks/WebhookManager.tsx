"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { MD3Card } from "@/components/md3/MD3Card"
import { MD3Button } from "@/components/md3/MD3Button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, Plus, Trash2, Settings } from "lucide-react"
import { toast } from "sonner" // Assuming sonner is used for toasts, or use existing toast lib

import {
  fetchWebhookEvents,
  fetchWebhookDeliveries,
  fetchWebhookConfigs,
  createWebhookConfig,
  deleteWebhookConfig,
  replayWebhookEvent,
  WebhookEvent,
  WebhookDelivery,
  WebhookConfig
} from "@/lib/webhook-api"

export function WebhookManager() {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "configs">("incoming")

  return (
    <div className="grid gap-6">
      <div className="flex space-x-2">
        <MD3Button
          variant={activeTab === "incoming" ? "filled" : "outlined"}
          onClick={() => setActiveTab("incoming")}
        >
          Incoming Events
        </MD3Button>
        <MD3Button
          variant={activeTab === "outgoing" ? "filled" : "outlined"}
          onClick={() => setActiveTab("outgoing")}
        >
          Outgoing Deliveries
        </MD3Button>
        <MD3Button
          variant={activeTab === "configs" ? "filled" : "outlined"}
          onClick={() => setActiveTab("configs")}
        >
          Configurations
        </MD3Button>
      </div>

      {activeTab === "incoming" ? (
        <IncomingEvents />
      ) : activeTab === "outgoing" ? (
        <OutgoingDeliveries />
      ) : (
        <WebhookConfigs />
      )}
    </div>
  )
}

function IncomingEvents() {
  const { data: events, error, isLoading, mutate } = useSWR('webhook-events', () => fetchWebhookEvents())

  const handleReplay = async (id: string) => {
    try {
      await replayWebhookEvent(id)
      toast.success("Event queued for replay")
      mutate()
    } catch (e) {
      toast.error("Failed to replay event")
    }
  }

  if (isLoading) return <div>Loading events...</div>
  if (error) return <div className="text-red-500">Failed to load events</div>

  return (
    <MD3Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Incoming Event Log</h3>
          <MD3Button variant="text" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4" />
          </MD3Button>
        </div>
        <ScrollArea className="h-[500px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b sticky top-0 bg-background">
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Provider</th>
                <th className="text-left p-2">Event Type</th>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events?.map((evt) => (
                <tr key={evt.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <StatusBadge status={evt.status} />
                  </td>
                  <td className="p-2 capitalize">{evt.provider}</td>
                  <td className="p-2 font-mono" title={evt.event_id}>{evt.event_type}</td>
                  <td className="p-2 text-muted-foreground">{new Date(evt.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <MD3Button variant="text" size="sm" onClick={() => handleReplay(evt.id)}>
                      <Play className="h-4 w-4 mr-1" /> Replay
                    </MD3Button>
                  </td>
                </tr>
              ))}
              {events?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">No events found</td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </MD3Card>
  )
}

function OutgoingDeliveries() {
  const { data: deliveries, error, isLoading, mutate } = useSWR('webhook-deliveries', () => fetchWebhookDeliveries())

  if (isLoading) return <div>Loading deliveries...</div>
  if (error) return <div className="text-red-500">Failed to load deliveries</div>

  return (
    <MD3Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Outgoing Delivery Log</h3>
          <MD3Button variant="text" onClick={() => mutate()}>
            <RefreshCw className="h-4 w-4" />
          </MD3Button>
        </div>
        <ScrollArea className="h-[500px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b sticky top-0 bg-background">
                <th className="text-left p-2">Status</th>
                <th className="text-left p-2">Event Type</th>
                <th className="text-left p-2">Attempts</th>
                <th className="text-left p-2">Response</th>
                <th className="text-left p-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {deliveries?.map((del) => (
                <tr key={del.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <StatusBadge status={del.status} />
                  </td>
                  <td className="p-2 font-mono">{del.event_type}</td>
                  <td className="p-2">{del.attempt_count}</td>
                  <td className="p-2 font-mono text-xs">{del.response_status || '-'}</td>
                  <td className="p-2 text-muted-foreground">{new Date(del.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {deliveries?.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">No deliveries found</td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </MD3Card>
  )
}

function WebhookConfigs() {
  const { data: configs, error, isLoading, mutate } = useSWR('webhook-configs', () => fetchWebhookConfigs())
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this endpoint?")) return
    try {
      await deleteWebhookConfig(id)
      toast.success("Configuration deleted")
      mutate()
    } catch (e) {
      toast.error("Failed to delete configuration")
    }
  }

  if (isLoading) return <div>Loading configurations...</div>
  if (error) return <div className="text-red-500">Failed to load configurations</div>

  return (
    <MD3Card>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Endpoint Configurations</h3>
          <div className="flex space-x-2">
            <MD3Button variant="text" onClick={() => mutate()}>
              <RefreshCw className="h-4 w-4" />
            </MD3Button>
            <CreateConfigDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} onSuccess={mutate} />
          </div>
        </div>
        <ScrollArea className="h-[500px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b sticky top-0 bg-background">
                <th className="text-left p-2">Active</th>
                <th className="text-left p-2">URL</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Events</th>
                <th className="text-left p-2">Created</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs?.map((config) => (
                <tr key={config.id} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className={`h-3 w-3 rounded-full ${config.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </td>
                  <td className="p-2 font-mono truncate max-w-[200px]" title={config.url}>{config.url}</td>
                  <td className="p-2">{config.description || '-'}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {config.event_types.slice(0, 3).map(et => (
                        <span key={et} className="bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded text-xs">{et}</span>
                      ))}
                      {config.event_types.length > 3 && <span className="text-xs text-muted-foreground">+{config.event_types.length - 3}</span>}
                    </div>
                  </td>
                  <td className="p-2 text-muted-foreground">{new Date(config.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    <MD3Button variant="text" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="h-4 w-4" />
                    </MD3Button>
                  </td>
                </tr>
              ))}
              {configs?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">No endpoints configured</td>
                </tr>
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </MD3Card>
  )
}

function CreateConfigDialog({ open, onOpenChange, onSuccess }: { open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    url: "",
    description: "",
    secret: "whsec_" + Math.random().toString(36).substring(7),
    event_types: "*",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await createWebhookConfig({
        ...formData,
        event_types: formData.event_types.split(",").map(s => s.trim()),
        is_active: true
      })
      toast.success("Webhook endpoint created")
      setFormData({
        url: "",
        description: "",
        secret: "whsec_" + Math.random().toString(36).substring(7),
        event_types: "*",
      })
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      toast.error("Failed to create endpoint")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <MD3Button variant="filled" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Endpoint
        </MD3Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Webhook Endpoint</DialogTitle>
          <DialogDescription>
            Configure a new destination for outgoing webhooks.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="url">Payload URL</Label>
            <Input
              id="url"
              placeholder="https://api.example.com/webhooks"
              required
              value={formData.url}
              onChange={e => setFormData({...formData, url: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Input
              id="desc"
              placeholder="Main production backend"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="events">Events (comma separated, * for all)</Label>
            <Input
              id="events"
              value={formData.event_types}
              onChange={e => setFormData({...formData, event_types: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="secret">Signing Secret</Label>
            <Input
              id="secret"
              value={formData.secret}
              readOnly
              className="font-mono bg-muted"
            />
            <p className="text-xs text-muted-foreground">Auto-generated secret for HMAC verification.</p>
          </div>
          <DialogFooter>
            <MD3Button type="submit" variant="filled" disabled={loading}>
              {loading ? "Creating..." : "Create Endpoint"}
            </MD3Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === "processed" || status === "success") {
    return (
      <span className="flex items-center text-green-600">
        <CheckCircle className="h-4 w-4 mr-1" /> Success
      </span>
    )
  }
  if (status === "failed") {
    return (
      <span className="flex items-center text-red-600">
        <AlertCircle className="h-4 w-4 mr-1" /> Failed
      </span>
    )
  }
  return (
    <span className="flex items-center text-yellow-600">
      <Clock className="h-4 w-4 mr-1" /> {status}
    </span>
  )
}
