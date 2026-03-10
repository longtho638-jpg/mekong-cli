/**
 * Modal for activating existing license keys.
 * Form fields: license key (required), domain (optional).
 * Returns JWT token for authenticated API calls.
 */
import { useState, useCallback } from 'react';
import { useLicenses, ActivateLicenseResult } from '../hooks/use-licenses';

interface ActivateLicenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (license: ActivateLicenseResult) => void;
}

export function ActivateLicenseModal({ open, onClose, onSuccess }: ActivateLicenseModalProps) {
  const [licenseKey, setLicenseKey] = useState('');
  const [domain, setDomain] = useState('');
  const [mkApiKey, setMkApiKey] = useState('');  // mk_ API key for RaaS Gateway
  const [copied, setCopied] = useState(false);
  const [useRaasGateway, setUseRaasGateway] = useState(false);  // Toggle between local and RaaS Gateway

  const { activateLicense, loading, error } = useLicenses();
  const [result, setResult] = useState<ActivateLicenseResult | null>(null);

  const handleClose = useCallback(() => {
    setLicenseKey('');
    setDomain('');
    setMkApiKey('');
    setCopied(false);
    setResult(null);
    setUseRaasGateway(false);
    onClose();
  }, [onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const activateResult = await activateLicense(
      licenseKey.trim(),
      domain.trim() || undefined,
      useRaasGateway ? mkApiKey.trim() || undefined : undefined
    );

    if (activateResult) {
      setResult(activateResult);
      onSuccess(activateResult);
    }
  }, [licenseKey, domain, mkApiKey, useRaasGateway, activateLicense, onSuccess]);

  const handleCopyKey = useCallback(async () => {
    if (result?.jwt) {
      await navigator.clipboard.writeText(result.jwt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-bg-card border border-bg-border rounded-lg shadow-2xl w-full max-w-lg font-mono">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-bg-border">
            <h2 className="text-white text-base font-bold tracking-tight">
              {result ? 'License Activated' : 'Activate License'}
            </h2>
            <button
              onClick={handleClose}
              className="text-muted hover:text-white transition-colors p-1 rounded hover:bg-bg-border"
              title="Close"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-4">
            {result ? (
              /* Success State - Show JWT Token */
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-profit/20 border border-profit/40 mb-3">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-profit">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold">License activated successfully!</p>
                  <p className="text-muted text-xs mt-1">JWT token generated for API authentication.</p>
                </div>

                {/* License Info */}
                <div className="bg-bg-primary border border-bg-border rounded p-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-[10px] uppercase">Tier:</span>
                    <span className={`text-xs font-semibold ${
                      result.tier === 'ENTERPRISE' ? 'text-amber-500' :
                      result.tier === 'PRO' ? 'text-accent' : 'text-muted'
                    }`}>
                      {result.tier}
                    </span>
                  </div>
                  {result.domain && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted text-[10px] uppercase">Domain:</span>
                      <span className="text-white text-xs">{result.domain}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted text-[10px] uppercase">Status:</span>
                    <span className="text-profit text-xs font-semibold">Active</span>
                  </div>
                </div>

                {/* JWT Token Display */}
                <div className="bg-bg-primary border border-bg-border rounded p-3">
                  <label className="text-muted text-[10px] uppercase tracking-widest mb-1 block">
                    JWT Token (valid 24h)
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-accent text-xs flex-1 break-all font-mono max-h-24 overflow-y-auto">
                      {result.jwt.split('.').slice(0, 2).join('.')}...
                    </code>
                    <button
                      onClick={handleCopyKey}
                      className="px-3 py-1.5 bg-bg-border hover:bg-accent/20 text-white text-xs rounded transition-colors flex items-center gap-1.5 shrink-0"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                          Copied
                        </>
                      ) : (
                        <>
                          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <rect x="9" y="9" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 bg-bg-border hover:bg-white/10 text-white text-sm font-semibold rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              // Form State
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* License Key Field */}
                <div>
                  <label htmlFor="license-key" className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                    License Key <span className="text-loss">*</span>
                  </label>
                  <input
                    id="license-key"
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="e.g., raas-free-abc123-XYZ789"
                    required
                    className="w-full px-3 py-2 bg-bg-primary border border-bg-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50 font-mono"
                  />
                  <p className="text-muted text-[10px] mt-1.5">Enter the license key to activate</p>
                </div>

                {/* Domain Field */}
                <div>
                  <label htmlFor="license-domain" className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                    Domain <span className="text-white/40">(Optional)</span>
                  </label>
                  <input
                    id="license-domain"
                    type="text"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g., production.example.com"
                    className="w-full px-3 py-2 bg-bg-primary border border-bg-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50"
                  />
                  <p className="text-muted text-[10px] mt-1.5">Associate license with a specific domain</p>
                </div>

                {/* RaaS Gateway Toggle */}
                <div className="flex items-center gap-2 py-2">
                  <input
                    id="use-raas-gateway"
                    type="checkbox"
                    checked={useRaasGateway}
                    onChange={(e) => setUseRaasGateway(e.target.checked)}
                    className="w-4 h-4 rounded border-bg-border bg-bg-primary text-accent focus:ring-accent"
                  />
                  <label htmlFor="use-raas-gateway" className="text-white text-sm font-medium">
                    Activate via RaaS Gateway (Cloudflare)
                  </label>
                </div>

                {/* mk_ API Key Field (only when using RaaS Gateway) */}
                {useRaasGateway && (
                  <div>
                    <label htmlFor="mk-api-key" className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                      mk_ API Key <span className="text-loss">*</span>
                    </label>
                    <input
                      id="mk-api-key"
                      type="text"
                      value={mkApiKey}
                      onChange={(e) => setMkApiKey(e.target.value)}
                      placeholder="mk_<key>:<tenantId>:<tier>"
                      required={useRaasGateway}
                      className="w-full px-3 py-2 bg-bg-primary border border-bg-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50 font-mono"
                    />
                    <p className="text-muted text-[10px] mt-1.5">Format: mk_&lt;key&gt;:&lt;tenantId&gt;:&lt;tier&gt;</p>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="p-3 bg-loss/10 border border-loss/40 rounded text-loss text-xs">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 bg-bg-border hover:bg-white/10 text-white text-sm font-semibold rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/90 text-bg-primary text-sm font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Activating...' : 'Activate License'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ActivateLicenseModal;
