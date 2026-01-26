import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
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
import { toast } from "sonner"
import QRCode from "qrcode"

export function MFASetup() {
  const [isOpen, setIsOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("")
  const [secret, setSecret] = useState<string>("")
  const [factorId, setFactorId] = useState<string>("")
  const [verifyCode, setVerifyCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  const startSetup = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      })

      if (error) throw error

      setFactorId(data.id)
      setSecret(data.totp.secret)

      // Generate QR Code
      const qrUrl = await QRCode.toDataURL(data.totp.uri)
      setQrCodeUrl(qrUrl)
    } catch (error: any) {
      toast.error(error.message)
      setIsOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const verifyAndEnable = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: verifyCode,
      })

      if (error) throw error

      toast.success("MFA Enabled Successfully")
      setIsOpen(false)
      // Ideally refresh the page or parent state to show MFA is on
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        setIsOpen(open)
        if (open) startSetup()
    }}>
      <DialogTrigger asChild>
        <Button>Enable MFA</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Setup Multi-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center gap-4 py-4">
          {isLoading && !qrCodeUrl ? (
             <div className="h-48 w-48 flex items-center justify-center">Loading...</div>
          ) : (
            <>
                {qrCodeUrl && (
                    <img src={qrCodeUrl} alt="MFA QR Code" className="h-48 w-48" />
                )}
                {secret && (
                    <div className="text-xs text-muted-foreground break-all text-center">
                        Secret: {secret}
                    </div>
                )}
            </>
          )}

          <div className="grid w-full gap-2">
            <Label htmlFor="code">Verification Code</Label>
            <Input
              id="code"
              placeholder="Enter 6-digit code"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={verifyAndEnable} disabled={isLoading || verifyCode.length !== 6}>
            {isLoading ? "Verifying..." : "Verify & Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
