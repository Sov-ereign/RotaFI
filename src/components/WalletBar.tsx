import { useState } from 'react';
import { Wallet, LogOut, Copy, Check, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { avatarGradient, initials, shortAddress } from '../lib/wallet';
import { Modal } from './Modal';

export function WalletBar() {
  const { identity, register, signOut, navigate, toast } = useApp();
  const [onboardOpen, setOnboardOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [name, setName] = useState('');
  const [copied, setCopied] = useState(false);

  if (!identity) {
    return (
      <>
        <button className="btn-primary btn-sm" onClick={() => setOnboardOpen(true)}>
          <Wallet className="h-4 w-4" />
          Connect wallet
        </button>
        <OnboardModal
          open={onboardOpen}
          name={name}
          setName={setName}
          onClose={() => setOnboardOpen(false)}
          onSubmit={async () => {
            if (!name.trim()) return;
            try {
              await register(name);
              setOnboardOpen(false);
              setName('');
              toast({ kind: 'success', title: 'Wallet created', description: 'Your testnet identity is ready.' });
              navigate({ name: 'dashboard' });
            } catch {
              toast({ kind: 'error', title: 'Could not create wallet', description: 'Please try again.' });
            }
          }}
        />
      </>
    );
  }

  const copyAddr = async () => {
    try {
      await navigator.clipboard.writeText(identity.publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  return (
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
          <div className="absolute right-0 z-20 mt-2 w-64 animate-scale-in card p-1.5 shadow-lift">
            <div className="px-3 py-2.5">
              <div className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Stellar testnet</div>
              <div className="mt-1 font-semibold text-ink-900">{identity.name}</div>
            </div>
            <button
              onClick={copyAddr}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition hover:bg-ink-50"
            >
              <span className="font-mono text-[11px] text-ink-500">{shortAddress(identity.publicKey, 10, 8)}</span>
              {copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4 text-ink-400" />}
            </button>
            <div className="my-1 h-px bg-ink-100" />
            <button
              onClick={() => { setMenuOpen(false); navigate({ name: 'dashboard' }); }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 transition hover:bg-ink-50"
            >
              <Wallet className="h-4 w-4 text-ink-400" /> My dashboard
            </button>
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
  );
}

function OnboardModal({
  open,
  name,
  setName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  name: string;
  setName: (v: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create your wallet identity"
      description="A Stellar testnet keypair is generated in your browser. No email, no password — your secret key never leaves this device."
      footer={
        <div className="flex justify-end gap-2">
          <button className="btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn-primary btn-sm" onClick={onSubmit} disabled={!name.trim()}>
            <Wallet className="h-4 w-4" /> Create wallet
          </button>
        </div>
      }
    >
      <label className="label">Display name</label>
      <input
        className="input"
        placeholder="e.g. Priya Sharma"
        value={name}
        autoFocus
        maxLength={40}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      <p className="mt-3 rounded-lg bg-sapphire-50 p-3 text-xs leading-relaxed text-sapphire-800 ring-1 ring-sapphire-100">
        This MVP uses a locally-generated Stellar keypair as a stand-in for Freighter wallet
        connection. On mainnet, the same flow connects to your installed Freighter extension
        and signs real transactions.
      </p>
    </Modal>
  );
}
