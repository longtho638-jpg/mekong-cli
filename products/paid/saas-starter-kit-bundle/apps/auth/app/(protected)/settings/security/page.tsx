"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MFASetup } from "@/components/security/mfa-setup"
import { Shield, ShieldAlert, Key } from "lucide-react"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

export default function SecuritySettingsPage() {
    const [factors, setFactors] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        loadFactors()
    }, [])

    const loadFactors = async () => {
        const { data, error } = await supabase.auth.mfa.listFactors()
        if (error) {
            toast.error("Failed to load security settings")
        } else {
            setFactors(data.all || [])
        }
        setIsLoading(false)
    }

    const hasVerifiedMFA = factors.some(f => f.status === 'verified')

    const unenroll = async (factorId: string) => {
        const { error } = await supabase.auth.mfa.unenroll({ factorId })
        if (error) {
            toast.error(error.message)
        } else {
            toast.success("MFA method removed")
            loadFactors()
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Security Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account security and multi-factor authentication.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-base flex items-center gap-2">
                                {hasVerifiedMFA ? (
                                    <Shield className="h-5 w-5 text-green-500" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 text-yellow-500" />
                                )}
                                Multi-Factor Authentication
                            </CardTitle>
                            <CardDescription>
                                Add an extra layer of security to your account.
                            </CardDescription>
                        </div>
                        {!hasVerifiedMFA && (
                           <MFASetup />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {factors.length > 0 ? (
                        <div className="space-y-4">
                            {factors.map((factor) => (
                                <div key={factor.id} className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="rounded-full bg-muted p-2">
                                            <Key className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Authenticator App</p>
                                            <p className="text-sm text-muted-foreground">
                                                Status: <span className="capitalize">{factor.status}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => unenroll(factor.id)}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">
                            No MFA methods configured. We strongly recommend enabling MFA.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Password</CardTitle>
                    <CardDescription>
                        Change your password securely.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Button variant="outline" onClick={() => toast.info("Password change flow would go here")}>Change Password</Button>
                </CardContent>
            </Card>
        </div>
    )
}
