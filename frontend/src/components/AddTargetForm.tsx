import { useState, type FormEvent } from 'react';
import { createTarget } from '../api';
import { getStoredApiKey, setStoredApiKey } from '../lib/apiKey';

interface AddTargetFormProps {
  onCreated: () => void;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function AddTargetForm({ onCreated }: AddTargetFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [intervalSeconds, setIntervalSeconds] = useState('60');
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function closeForm() {
    setOpen(false);
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    const trimmedUrl = url.trim();
    const trimmedKey = apiKey.trim();
    const interval = Number(intervalSeconds);

    if (!trimmedName || !trimmedUrl) {
      setError('Name and URL are required');
      return;
    }

    if (!isValidHttpUrl(trimmedUrl)) {
      setError('URL must be a valid http or https address');
      return;
    }

    if (!Number.isInteger(interval) || interval < 10) {
      setError('Check interval must be an integer of at least 10 seconds');
      return;
    }

    if (!trimmedKey) {
      setError('API key is required');
      return;
    }

    setSubmitting(true);
    try {
      await createTarget(
        {
          name: trimmedName,
          url: trimmedUrl,
          checkIntervalSeconds: interval,
        },
        trimmedKey,
      );
      setStoredApiKey(trimmedKey);
      setApiKey(trimmedKey);
      setName('');
      setUrl('');
      setIntervalSeconds('60');
      setSuccess('Target added - worker will pick it up within ~60s');
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add target');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      >
        <svg
          className="h-4 w-4 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add target
      </button>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-700">Add target</h2>
        </div>
        <button
          type="button"
          onClick={closeForm}
          aria-label="Close add target form"
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My site"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            disabled={submitting}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">URL</span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            disabled={submitting}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">Check interval (seconds)</span>
          <input
            type="number"
            min={10}
            step={1}
            value={intervalSeconds}
            onChange={(e) => setIntervalSeconds(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            disabled={submitting}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-gray-600">API key</span>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="API key from backend .env"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            disabled={submitting}
          />
        </label>

        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Adding...' : 'Add target'}
          </button>
          <button
            type="button"
            onClick={closeForm}
            disabled={submitting}
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-60"
          >
            Cancel
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {success && <p className="text-sm text-green-700">{success}</p>}
        </div>
      </form>
    </section>
  );
}
