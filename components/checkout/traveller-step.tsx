"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Traveller {
  id: string;
  title: string;
  firstName: string;
  surname: string;
  dob: string;
  nationality: string;
  gender: "Male" | "Female";
  passportNumber?: string;
  passportExpiry?: string;
}

interface TravellerStepProps {
  travellers: Traveller[];
  contact: { phoneCode: string; phone: string; email: string; whatsapp: boolean };
  onTravellersChange: (travellers: Traveller[]) => void;
  onContactChange: (contact: any) => void;
  onComplete: () => void;
}

export function TravellerStep({
  travellers,
  contact,
  onTravellersChange,
  onContactChange,
  onComplete,
}: TravellerStepProps) {
  const [expandedId, setExpandedId] = useState<string | null>(travellers[0]?.id || null);

  const updateTraveller = (id: string, field: string, value: string) => {
    onTravellersChange(
      travellers.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const isValid =
    travellers.every(
      (t) =>
        t.firstName.trim() &&
        t.surname.trim() &&
        t.dob &&
        t.passportNumber?.trim()
    ) &&
    contact.phone.trim() &&
    contact.email.trim();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-h3 text-ink-800">Traveller Information</h3>
          <button
            onClick={() => {
              const newId = `traveller-${Date.now()}`;
              onTravellersChange([
                ...travellers,
                {
                  id: newId,
                  title: "Mr.",
                  firstName: "",
                  surname: "",
                  dob: "",
                  nationality: "Bangladeshi",
                  gender: "Male",
                },
              ]);
              setExpandedId(newId);
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
          >
            <Plus size={16} /> Add Traveller
          </button>
        </div>

        <div className="space-y-3">
          {travellers.map((traveller, idx) => (
            <div
              key={traveller.id}
              className="border border-line rounded-lg overflow-hidden hover:border-brand-300 transition-colors"
            >
              <button
                onClick={() =>
                  setExpandedId(expandedId === traveller.id ? null : traveller.id)
                }
                className="w-full px-4 py-3 flex items-center justify-between bg-surface-alt hover:bg-surface transition-colors"
              >
                <div className="text-left">
                  <div className="text-sm font-medium text-ink-800">
                    Traveller {idx + 1}: {traveller.title} {traveller.firstName} {traveller.surname}
                  </div>
                  {!traveller.firstName && (
                    <div className="text-xs text-urgent mt-1">Incomplete</div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {travellers.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTravellersChange(travellers.filter((t) => t.id !== traveller.id));
                        if (expandedId === traveller.id) setExpandedId(null);
                      }}
                      className="p-1.5 rounded-md hover:bg-danger hover:bg-opacity-10 text-ink-400 hover:text-danger transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {expandedId === traveller.id ? (
                    <ChevronUp size={20} className="text-ink-400" />
                  ) : (
                    <ChevronDown size={20} className="text-ink-400" />
                  )}
                </div>
              </button>

              {expandedId === traveller.id && (
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="text-label text-ink-500 block mb-1">Title</label>
                      <select
                        value={traveller.title}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "title", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      >
                        <option>Mr.</option>
                        <option>Mrs.</option>
                        <option>Ms.</option>
                        <option>Dr.</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-label text-ink-500 block mb-1">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={traveller.firstName}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "firstName", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="First name"
                      />
                    </div>
                    <div>
                      <label className="text-label text-ink-500 block mb-1">Surname</label>
                      <input
                        type="text"
                        value={traveller.surname}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "surname", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="Surname"
                      />
                    </div>
                    <div>
                      <label className="text-label text-ink-500 block mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={traveller.dob}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "dob", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-label text-ink-500 block mb-1">Nationality</label>
                      <input
                        type="text"
                        value={traveller.nationality}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "nationality", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="Bangladeshi"
                      />
                    </div>
                    <div>
                      <label className="text-label text-ink-500 block mb-1">Gender</label>
                      <select
                        value={traveller.gender}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "gender", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-label text-ink-500 block mb-1">
                        Passport Number
                      </label>
                      <input
                        type="text"
                        value={traveller.passportNumber || ""}
                        onChange={(e) =>
                          updateTraveller(traveller.id, "passportNumber", e.target.value)
                        }
                        className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                        placeholder="Passport #"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-label text-ink-500 block mb-1">Passport Expiry</label>
                    <input
                      type="date"
                      value={traveller.passportExpiry || ""}
                      onChange={(e) =>
                        updateTraveller(traveller.id, "passportExpiry", e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <h3 className="text-h3 text-ink-800 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-label text-ink-500 block mb-1">Phone Code</label>
            <input
              type="text"
              value={contact.phoneCode}
              onChange={(e) =>
                onContactChange({ ...contact, phoneCode: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="text-label text-ink-500 block mb-1">Phone Number</label>
            <input
              type="tel"
              value={contact.phone}
              onChange={(e) =>
                onContactChange({ ...contact, phone: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              placeholder="1XXXXXXXXX"
            />
          </div>
          <div>
            <label className="text-label text-ink-500 block mb-1">Email</label>
            <input
              type="email"
              value={contact.email}
              onChange={(e) =>
                onContactChange({ ...contact, email: e.target.value })
              }
              className="w-full px-3 py-2 rounded-md border border-line text-sm focus:outline-none focus:border-brand-500"
              placeholder="your@email.com"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={contact.whatsapp}
              onChange={(e) =>
                onContactChange({ ...contact, whatsapp: e.target.checked })
              }
              className="w-4 h-4 rounded accent-brand-500"
            />
            <span className="text-sm text-ink-600">Send updates via WhatsApp</span>
          </label>
        </div>
      </div>

      <button
        onClick={onComplete}
        disabled={!isValid}
        className={cn(
          "w-full py-3 rounded-lg font-medium transition-colors",
          isValid
            ? "bg-brand-500 text-white hover:bg-brand-600"
            : "bg-surface-alt text-ink-400 cursor-not-allowed"
        )}
      >
        Continue to Add-ons
      </button>
    </div>
  );
}
