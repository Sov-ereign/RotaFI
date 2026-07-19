import { useState } from 'react';
import { Wallet, LogOut, Copy, Check, ChevronDown, ExternalLink, AlertCircle, Edit2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress } from '../lib/wallet';
import { Modal } from './Modal';

export function WalletBar() {
  const { identity, freighterInstalled, connect, signOut, navigate, toast, setDisplayName } = useApp();
  const [connecting, setConnecting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editNameOpen, setEditNameOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');

  // ── Not connected ──────────────────────────────────────────────────────────

  if (!identity) {
    if (!freighterInstalled) {
      return (
        <>
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary btn-sm flex items-center gap-1.5"
          >
            <AlertCircle className="h-4 w-4 text-saffron-500" />
            Install Freighter
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        </>
      );
    }

    return (
      <button
        className="btn-primary btn-sm"
        disabled={connecting}
        onClick={async () => {
          setConnecting(true);
          try {
            await connect();
            toast({ kind: 'success', title: 'Freighter connected', description: 'Your Stellar wallet is ready.' });
            navigate({ name: 'dashboard' });
          } catch (e) {
            toast({
              kind: 'error',
              title: 'Connection failed',
              description: e instanceof Error ? e.message : 'Could not connect to Freighter.',
            });
          } finally {
            setConnecting(false);
          }
        }}
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting…' : 'Connect Freighter'}
      </button>
    );
  }

  // ── Connected ──────────────────────────────────────────────────────────────

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(identity.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="group flex items-center gap-2 rounded-xl bg-white py-1.5 pl-1.5 pr-2.5 ring-1 ring-inset ring-ink-200 transition hover:ring-ink-300"
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: avatarGradient(identity.publicKey) }}
          >
            {initials(identity.name)}
          </span>
          <span className="hidden text-left sm:block">
            <span className="block text-xs font-semibold leading-tight text-ink-900">{identity.name}</span>
            <span className="block font-mono text-[10px] leading-tight text-ink-400">
              {shortAddress(identity.publicKey)}
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-ink-400 transition group-hover:text-ink-600" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 w-72 animate-scale-in card p-1.5 shadow-lift">
              {/* Header */}
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
                    style={{ background: avatarGradient(identity.publicKey) }}
                  >
                    {initials(identity.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-ink-900 leading-tight">{identity.name}</div>
                    <div className="text-[10px] font-medium text-brand-600 uppercase tracking-wide">
                      Stellar {identity.network || 'Testnet'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address copy */}
              <button
                onClick={copyAddr}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-ink-50"
              >
                <span className="font-mono text-[11px] text-ink-500">{shortAddress(identity.publicKey, 10, 8)}</span>
                {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4 text-ink-400" />}
              </button>

              <div className="my-1 h-px bg-ink-100" />

              {/* Actions */}
              <button
                onClick={() => { setMenuOpen(false); navigate({ name: 'dashboard' }); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-ink-50"
              >
                <Wallet className="h-4 w-4 text-ink-400" /> My dashboard
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setNameInput(identity.name);
                  setEditNameOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-ink-50"
              >
                <Edit2 className="h-4 w-4 text-ink-400" /> Edit display name
              </button>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${identity.publicKey}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-ink-50"
                onClick={() => setMenuOpen(false)}
              >
                <ExternalLink className="h-4 w-4 text-ink-400" /> View on Explorer
              </a>

              <div className="my-1 h-px bg-ink-100" />

              <button
                onClick={() => { setMenuOpen(false); signOut(); }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger-600 transition hover:bg-danger-50"
              >
                <LogOut className="h-4 w-4" /> Disconnect
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit name modal */}
      <Modal
        open={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="Edit display name"
        description="This name is stored locally and shown to other committee members."
        footer={
          <div className="flex justify-end gap-2">
            <button className="btn-ghost btn-sm" onClick={() => setEditNameOpen(false)}>Cancel</button>
            <button
              className="btn-primary btn-sm"
              onClick={() => {
                if (nameInput.trim()) {
                  setDisplayName(nameInput.trim());
                  setEditNameOpen(false);
                  toast({ kind: 'success', title: 'Name updated' });
                }
              }}
              disabled={!nameInput.trim()}
            >
              Save
            </button>
          </div>
        }
      >
        <label className="label">Display name</label>
        <input
          className="input"
          value={nameInput}
          autoFocus
          maxLength={40}
          placeholder="e.g. Priya Sharma"
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && nameInput.trim()) {
              setDisplayName(nameInput.trim());
              setEditNameOpen(false);
              toast({ kind: 'success', title: 'Name updated' });
            }
          }}
        />
      </Modal>
    </>
  );
}
