"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { savedTravellers } from "@/lib/mock/travellers";

export default function TravellersPage() {
  const [showForm, setShowForm] = useState(false);
  const [travellers, setTravellers] = useState(savedTravellers);

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-sora font-bold text-h1 text-ink-800">Saved Travellers</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> Add Traveller
        </button>
      </div>

      {travellers.length === 0 ? (
        <div className="text-center py-12 text-ink-400 text-sm">
          No saved travellers yet.
        </div>
      ) : (
        <div className="space-y-3">
          {travellers.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 rounded-lg border border-line hover:border-brand-300 transition-all">
              <div>
                <div className="font-medium text-ink-700">{t.title} {t.firstName} {t.surname}</div>
                <div className="text-sm text-ink-400">{t.nationality} · {t.gender} · {t.dob}</div>
                <div className="text-xs text-ink-400">{t.phone} · {t.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-md hover:bg-surface-alt transition-colors text-ink-400 hover:text-ink-700"><Pencil size={16} /></button>
                <button className="p-2 rounded-md hover:bg-surface-alt transition-colors text-ink-400 hover:text-danger"><Trash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="mt-6 p-6 rounded-lg border-2 border-brand-300 bg-brand-50">
          <h3 className="font-semibold text-ink-700 mb-4">New Traveller</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-label text-ink-500 block mb-1">Title</label>
              <select className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500">
                <option>Mr.</option><option>Mrs.</option><option>Ms.</option>
              </select>
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">First Name</label>
              <input type="text" className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="First name" />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Surname</label>
              <input type="text" className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" placeholder="Surname" />
            </div>
            <div>
              <label className="text-label text-ink-500 block mb-1">Date of Birth</label>
              <input type="date" className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors">Cancel</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors">Save</button>
          </div>
        </div>
      )}
    </div>
  );
}
