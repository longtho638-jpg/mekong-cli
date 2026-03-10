/**
 * Modal for creating new license keys.
 * Form fields: name, tier, expiration date, tenant ID (optional).
 */
import { useState, useCallback } from 'react';
import { useCreateLicense, CreateLicenseInput } from '../hooks/use-create-license';

interface CreateLicenseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (licenseKey: string) => void;
}

const TIERS: { value: 'FREE' | 'PRO' | 'ENTERPRISE'; label: string; description: string }[] = [
  { value: 'FREE', label: 'FREE', description: 'Basic features, limited usage' },
  { value: 'PRO', label: 'PRO', description: 'Advanced features, priority support' },
  { value: 'ENTERPRISE', label: 'ENTERPRISE', description: 'Full features, unlimited usage' },
];

export function CreateLicenseModal({ open, onClose, onSuccess }: CreateLicenseModalProps) {
  const [name, setName] = useState('');
  const [tier, setTier] = useState<'FREE' | 'PRO' | 'ENTERPRISE'>('FREE');
  const [expiresAt, setExpiresAt] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [copied, setCopied] = useState(false);

  const { createLicense, loading, error, reset } = useCreateLicense();
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const resetForm = useCallback(() => {
    setName('');
    setTier('FREE');
    setExpiresAt('');
    setTenantId('');
    setGeneratedKey(null);
    setCopied(false);
    reset();
  }, [reset]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreateLicenseInput = {
      name: name.trim(),
      tier,
      expiresAt: expiresAt || undefined,
      tenantId: tenantId.trim() || undefined,
    };

    const result = await createLicense(input);

    if (result) {
      setGeneratedKey(result.key);
      onSuccess(result.key);
    }
  }, [name, tier, expiresAt, tenantId, createLicense, onSuccess]);

  const handleCopyKey = useCallback(async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [generatedKey]);

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
              {generatedKey ? 'License Generated' : 'Create New License'}
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
            {generatedKey ? (
              /* Success State - Show Generated Key */
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-profit/20 border border-profit/40 mb-3">
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className="text-profit">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-semibold">License key generated successfully!</p>
                  <p className="text-muted text-xs mt-1">Store this key securely. It won't be shown again.</p>
                </div>

                {/* Key Display */}
                <div className="bg-bg-primary border border-bg-border rounded p-3">
                  <label className="text-muted text-[10px] uppercase tracking-widest mb-1 block">
                    License Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="text-accent text-sm flex-1 break-all font-mono">
                      {generatedKey}
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
              /* Form State */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Field */}
                <div>
                  <label htmlFor="license-name" className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                    License Name <span className="text-loss">*</span>
                  </label>
                  <input
                    id="license-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Production License 001"
                    required
                    className="w-full px-3 py-2 bg-bg-primary border border-bg-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50"
                  />
                </div>

                {/* Tier Select */}
                <div>
                  <label className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                    Tier <span className="text-loss">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {TIERS.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTier(t.value)}
                        className={`
                          px-3 py-2.5 rounded border text-xs font-semibold transition-all
                          ${tier === t.value
                            ? 'bg-accent/20 border-accent text-accent'
                            : 'bg-bg-primary border-bg-border text-muted hover:border-white/30'
                          }
                        `}
                        title={t.description}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-muted text-[10px] mt-1.5">{TIERS.find((t) => t.value === tier)?.description}</p>
                </div>

                {/* Expiration Date */}
                <div>
                  <label htmlFor="license-expires" className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                    Expiration Date
                  </label>
                  <input
                    id="license-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-bg-primary border border-bg-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                  <p className="text-muted text-[10px] mt-1.5">Leave empty for non-expiring license</p>
                </div>

                {/* Tenant ID */}
                <div>
                  <label htmlFor="license-tenant" className="block text-muted text-[10px] uppercase tracking-widest mb-1.5">
                    Tenant ID <span className="text-white/40">(Optional)</span>
                  </label>
                  <input
                    id="license-tenant"
                    type="text"
                    value={tenantId}
                    onChange={(e) => setTenantId(e.target.value)}
                    placeholder="e.g., tenant_abc123"
                    className="w-full px-3 py-2 bg-bg-primary border border-bg-border text-white text-sm rounded focus:outline-none focus:ring-1 focus:ring-accent placeholder:text-muted/50"
                  />
                  <p className="text-muted text-[10px] mt-1.5">Bind license to specific tenant</p>
                </div>

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
                    {loading ? 'Generating...' : 'Generate License'}
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

export default CreateLicenseModal;
