"use client";

import { useEffect, useState } from 'react';

type PurifierState = {
  status?: boolean;
  fanSpeed?: number; // 0-10
  efficientFiltration?: boolean;
  airFiltered?: number; // e.g., cubic meters
  lastMaintenance?: string; // ISO string
};

export default function PurifierCard({ id }: { id: string }) {
  const [state, setState] = useState<PurifierState>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/purifiers/state?id=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const json = await res.json();
      if (json.success) setState(json.data || {});
      else setError(json.error || 'Failed to load');
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [id]);

  const apply = async (updates: Partial<PurifierState>) => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/purifiers/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Apply failed');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to apply');
    } finally {
      setSaving(false);
    }
  };

  const lastMaint = state.lastMaintenance ? new Date(state.lastMaintenance) : null;
  const minSpeed = 1426;
  const maxSpeed = 1550;
  const isEfficient = !!state.efficientFiltration;
  const currentSpeed = (() => {
    const isOn = !!state.status;
    if (!isOn) return 1425;
    if (isEfficient) return 1500;
    const s = state.fanSpeed ?? minSpeed;
    if (s < minSpeed) return minSpeed;
    if (s > maxSpeed) return maxSpeed;
    return s;
  })();

  return (
    <div className="bg-surface-light dark:bg-surface-dark border rounded-2xl p-5 w-full max-w-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Purifier · {id}</h3>
        <button onClick={load} className="text-sm px-2 py-1 border rounded" disabled={loading}>Refresh</button>
      </div>
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="col-span-2 flex items-center justify-between p-3 rounded border">
          <span>Status</span>
          <button
            onClick={() => {
              const next = !state.status;
              if (!next) {
                // Turning Off: set fan speed to 1425 to fully stop and lock slider
                setState((prev) => ({ ...prev, status: false, fanSpeed: 1425 }));
                apply({ status: false, fanSpeed: 1425 });
              } else {
                // Turning On: enable and set to baseline speed (1426) unless efficient mode forces 1500
                const targetSpeed = state.efficientFiltration ? 1500 : 1426;
                setState((prev) => ({ ...prev, status: true, fanSpeed: targetSpeed }));
                apply({ status: true, fanSpeed: targetSpeed });
              }
            }}
            className={`px-3 py-1 rounded text-white ${state.status ? 'bg-green-600' : 'bg-gray-500'}`}
            disabled={saving}
          >{state.status ? 'On' : 'Off'}</button>
        </div>

        <div className="col-span-2 p-3 rounded border">
          <div className="flex items-center justify-between mb-2">
            <span>Fan Speed</span>
            <span className="font-semibold">{currentSpeed}</span>
          </div>
          <input
            type="range"
            min={minSpeed}
            max={maxSpeed}
            step={1}
            value={currentSpeed}
            onChange={(e) => {
              // allow UI feedback when not in efficient mode and when device is on
              const isOn = !!state.status;
              if (!isEfficient && isOn) setState((prev) => ({ ...prev, fanSpeed: Number((e.target as HTMLInputElement).value) }));
            }}
            onMouseUp={(e) => {
              const isOn = !!state.status;
              if (!isEfficient && isOn) apply({ fanSpeed: Number((e.target as HTMLInputElement).value) });
            }}
            onTouchEnd={(e) => {
              const isOn = !!state.status;
              if (!isEfficient && isOn) apply({ fanSpeed: Number((e.target as HTMLInputElement).value) });
            }}
            className="w-full"
            disabled={saving || isEfficient || !state.status}
          />
        </div>

        <div className="col-span-2 flex items-center justify-between p-3 rounded border">
          <span>Efficient Filtration</span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEfficient}
              onChange={async (e) => {
                const next = e.target.checked;
                if (next) {
                  // lock to efficient mode and set speed 1500
                  await apply({ efficientFiltration: true, fanSpeed: 1500 });
                } else {
                  await apply({ efficientFiltration: false });
                }
              }}
              disabled={saving}
            />
          </label>
        </div>

        <div className="p-3 rounded border">
          <div className="text-gray-500">Air Filtered</div>
          <div className="text-xl font-semibold">{state.airFiltered ?? 0}<span className="text-sm ml-1">m³</span></div>
        </div>

        <div className="p-3 rounded border">
          <div className="text-gray-500">Last Maintenance</div>
          <div className="text-sm">{lastMaint ? lastMaint.toLocaleString() : '-'}</div>
        </div>
      </div>
    </div>
  );
}
