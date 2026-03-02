/**
 * Exchange keys (API keys) management panel.
 * Handles create / revoke actions via parent-supplied callbacks.
 */

export interface ApiKey {
  id: string;
  prefix: string;
  maskedKey: string;
  createdAt: string;
}

interface Props {
  tenantId: string;
  apiKeys: ApiKey[];
  newKeyVisible: string | null;
  creatingKey: boolean;
  onCreateKey: () => void;
  onDeleteKey: (keyId: string) => void;
  onDismissNewKey: () => void;
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h2 className="text-accent text-sm font-semibold uppercase tracking-wider mb-4">
      {title}
    </h2>
  );
}

export function SettingsExchangeKeysForm({
  apiKeys,
  newKeyVisible,
  creatingKey,
  onCreateKey,
  onDeleteKey,
  onDismissNewKey,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between">
        <SectionHeader title="API Keys" />
        <button
          onClick={onCreateKey}
          disabled={creatingKey}
          className="text-xs bg-accent text-bg font-bold px-3 py-1.5 rounded hover:opacity-90 disabled:opacity-50 transition-opacity mb-4"
        >
          {creatingKey ? 'Creating…' : '+ New Key'}
        </button>
      </div>

      {newKeyVisible && (
        <div className="bg-profit/10 border border-profit/30 rounded p-3 mb-2">
          <p className="text-profit text-xs font-semibold mb-1">
            Copy this key now — it will not be shown again.
          </p>
          <code className="text-white text-xs font-mono break-all">{newKeyVisible}</code>
          <button
            onClick={onDismissNewKey}
            className="ml-3 text-muted text-xs underline hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="space-y-2">
        {apiKeys.length === 0 && (
          <p className="text-muted text-sm">No API keys yet.</p>
        )}
        {apiKeys.map((k) => (
          <div
            key={k.id}
            className="flex items-center justify-between bg-bg border border-bg-border rounded px-3 py-2"
          >
            <div>
              <code className="text-white text-xs font-mono">{k.maskedKey}</code>
              <p className="text-muted text-xs mt-0.5">
                Created {new Date(k.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={() => onDeleteKey(k.id)}
              className="text-loss text-xs hover:underline font-mono"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
