"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTravellersStore } from "@/lib/store/travellers";
import { type SavedTraveller } from "@/lib/mock/travellers";

export default function TravellersPage() {
  const store = useTravellersStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<SavedTraveller>>({
    title: "Mr.",
    firstName: "",
    surname: "",
    dob: "",
    nationality: "Bangladeshi",
    gender: "Male",
    phone: "",
    email: "",
  });

  const handleOpenForm = (traveller?: SavedTraveller) => {
    if (traveller) {
      setFormData(traveller);
      setEditingId(traveller.id);
    } else {
      setFormData({
        title: "Mr.",
        firstName: "",
        surname: "",
        dob: "",
        nationality: "Bangladeshi",
        gender: "Male",
        phone: "",
        email: "",
      });
      setEditingId(null);
    }
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.firstName?.trim() || !formData.surname?.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    if (editingId) {
      store.updateTraveller(editingId, formData);
    } else {
      const newTraveller: SavedTraveller = {
        id: `traveller-${Date.now()}`,
        title: formData.title as "Mr." | "Mrs." | "Ms.",
        firstName: formData.firstName,
        surname: formData.surname,
        dob: formData.dob || "",
        nationality: formData.nationality || "Bangladeshi",
        gender: formData.gender as "Male" | "Female",
        phone: formData.phone || "",
        email: formData.email || "",
      };
      store.addTraveller(newTraveller);
    }

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    store.deleteTraveller(id);
    setShowDeleteConfirm(null);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <div className="bg-surface border border-line rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-h1 font-sora font-bold text-ink-800">Saved Travellers</h1>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
        >
          <Plus size={16} /> Add Traveller
        </button>
      </div>

      {store.travellers.length === 0 && !showForm ? (
        <div className="text-center py-12 text-ink-400 text-sm">
          No saved travellers yet. Add one to speed up future bookings.
        </div>
      ) : (
        <div className="space-y-3">
          {store.travellers.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between p-4 rounded-lg border border-line hover:border-brand-300 hover:bg-brand-50 transition-all"
            >
              <div>
                <div className="font-medium text-ink-800">
                  {t.title} {t.firstName} {t.surname}
                </div>
                <div className="text-sm text-ink-500 mt-1">
                  {t.nationality} • {t.gender} • {t.dob}
                </div>
                {t.phone && (
                  <div className="text-xs text-ink-400 mt-1">
                    {t.phone} • {t.email}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenForm(t)}
                  className="p-2 rounded-md hover:bg-surface-alt transition-colors text-ink-400 hover:text-brand-600"
                  title="Edit traveller"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(t.id)}
                  className="p-2 rounded-md hover:bg-surface-alt transition-colors text-ink-400 hover:text-danger"
                  title="Delete traveller"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Delete confirmation */}
              {showDeleteConfirm === t.id && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-surface-alt border border-line rounded-lg p-3 shadow-e3 z-10">
                  <div className="text-sm text-ink-700 mb-2 font-medium">
                    Delete traveller?
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="px-3 py-1 text-xs rounded-md bg-danger text-white hover:bg-opacity-80 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 text-xs rounded-md border border-line hover:bg-surface-alt transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mt-6 p-6 rounded-lg border-2 border-brand-300 bg-brand-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-h3 font-sora font-bold text-ink-800">
              {editingId ? "Edit Traveller" : "New Traveller"}
            </h3>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-md hover:bg-brand-100 transition-colors text-ink-400 hover:text-ink-600"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-label text-ink-600 block mb-1">Title</label>
              <select
                value={formData.title || "Mr."}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              >
                <option>Mr.</option>
                <option>Mrs.</option>
                <option>Ms.</option>
              </select>
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName || ""}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">Surname *</label>
              <input
                type="text"
                value={formData.surname || ""}
                onChange={(e) =>
                  setFormData({ ...formData, surname: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                placeholder="Surname"
              />
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">Date of Birth</label>
              <input
                type="date"
                value={formData.dob || ""}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">Nationality</label>
              <input
                type="text"
                value={formData.nationality || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nationality: e.target.value })
                }
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                placeholder="e.g. Bangladeshi"
              />
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">Gender</label>
              <select
                value={formData.gender || "Male"}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              >
                <option>Male</option>
                <option>Female</option>
              </select>
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">Phone</label>
              <input
                type="tel"
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                placeholder="Phone number"
              />
            </div>
            <div>
              <label className="text-label text-ink-600 block mb-1">Email</label>
              <input
                type="email"
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                placeholder="Email"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 rounded-md border border-line text-sm text-ink-600 hover:bg-surface-alt transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-md bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 transition-colors"
            >
              {editingId ? "Update" : "Add"} Traveller
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
