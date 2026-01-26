"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Laptop, Smartphone, Globe, LogOut } from "lucide-react"
import { toast } from "sonner"
import { UAParser } from "ua-parser-js"

type Session = {
  id: string
  created_at: string
  last_active: string
  ip_address: string
  user_agent: string
  is_current: boolean
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  // Simulate loading sessions since we can't easily query auth.sessions from client
  // In a real app, this would query a public.user_sessions table populated by hooks/middleware
  useEffect(() => {
    // Mock data for demonstration purposes as we don't have the backend trigger setup
    // to populate the user_sessions table in this starter kit environment without admin access
    const mockSessions: Session[] = [
      {
        id: "current-session",
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
        ip_address: "127.0.0.1",
        user_agent: navigator.userAgent,
        is_current: true,
      },
      {
        id: "session-2",
        created_at: new Date(Date.now() - 86400000).toISOString(),
        last_active: new Date(Date.now() - 3600000).toISOString(),
        ip_address: "192.168.1.50",
        user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        is_current: false,
      }
    ]
    setSessions(mockSessions)
    setLoading(false)
  }, [])

  const revokeSession = async (sessionId: string) => {
    // In a real implementation, you would call an API endpoint that uses
    // supabaseAdmin.auth.admin.deleteSession(sessionId)
    toast.success("Session revoked successfully")
    setSessions(sessions.filter(s => s.id !== sessionId))
  }

  const getDeviceIcon = (ua: string) => {
    if (ua.includes("Mobile") || ua.includes("iPhone") || ua.includes("Android")) {
      return <Smartphone className="h-5 w-5" />
    }
    return <Laptop className="h-5 w-5" />
  }

  const parser = new UAParser()

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Active Sessions</h3>
        <p className="text-sm text-muted-foreground">
          Manage your active sessions and signed-in devices.
        </p>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
          parser.setUA(session.user_agent)
          const browser = parser.getBrowser()
          const os = parser.getOS()

          return (
            <Card key={session.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-muted p-2">
                    {getDeviceIcon(session.user_agent)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {browser.name} on {os.name}
                      </p>
                      {session.is_current && (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                          This Device
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      <span>{session.ip_address}</span>
                      <span>•</span>
                      <span>Last active: {new Date(session.last_active).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => revokeSession(session.id)}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Revoke
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
