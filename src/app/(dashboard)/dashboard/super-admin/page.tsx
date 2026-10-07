"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Crown,
  ShieldAlert,
  Users,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Save,
  ArrowRight,
} from "lucide-react";
import { Role } from "@prisma/client";

export default function SuperAdminDashboardPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New setting inputs
  const [settingKey, setSettingKey] = useState("");
  const [settingValue, setSettingValue] = useState("");
  const [savingSetting, setSavingSetting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/super-admin/settings"),
      ]);

      if (uRes.ok) {
        const uData = await uRes.json();
        setUsers(uData.users || []);
      }

      if (sRes.ok) {
        const sData = await sRes.json();
        setSettings(sData.settings || []);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to load Super Administrator console");
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: Role) {
    setUpdatingRoleId(userId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update role");
      } else {
        setSuccessMsg(data.message);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error updating role");
    } finally {
      setUpdatingRoleId(null);
    }
  }

  async function handleSaveSetting(e: React.FormEvent) {
    e.preventDefault();
    if (!settingKey.trim()) return;

    setSavingSetting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/super-admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: settingKey, value: settingValue }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to save platform setting");
      } else {
        setSuccessMsg(`Setting '${settingKey}' updated.`);
        setSettingKey("");
        setSettingValue("");
        loadData();
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error saving setting");
    } finally {
      setSavingSetting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Header Banner */}
      <div className="p-8 sm:p-12 rounded-3xl shadow-lg relative overflow-hidden bg-[linear-gradient(135deg,#21140f_0%,#141417_55%,#0f0f12_100%)] text-text border border-cream/25">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-semibold bg-white/10 text-cream border border-cream/40 flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-cream" />
                <span>Super Administrator Console</span>
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight">
              Platform Governance & RBAC
            </h1>
            <p className="text-white/80 text-base max-w-2xl leading-relaxed">
              Full authority to promote or adjust roles, audit active sessions, configure platform parameters, and manage clinic security.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/admin"
              className="px-5 py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-xs font-semibold text-black transition-colors shadow-sm"
            >
              Sessions & Bookings Agenda
            </Link>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-cream/10 border border-cream/30 text-cream text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Management Matrix */}
      <div className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
              <Users className="w-5 h-5 text-cream" />
              <span>Role Assignment & Permissions Matrix</span>
            </h2>
            <p className="text-xs text-ink/60 mt-1">
              Select any role below to update access permissions in the database and active session.
            </p>
          </div>
          <span className="text-xs text-ink/60 font-medium">{users.length} Registered Accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-ink">
            <thead className="bg-ivory text-ink/70 uppercase text-[10px] font-bold tracking-wider border-b border-mist">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Path</th>
                <th className="py-3.5 px-4">Registered</th>
                <th className="py-3.5 px-4">Change Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mist">
              {users.map((u) => {
                const isCurrentUser = session?.user?.id === u.id;
                const isUpdating = updatingRoleId === u.id;

                return (
                  <tr key={u.id} className="hover:bg-ivory/50 transition-colors">
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="font-semibold text-ink flex items-center gap-1.5">
                          <span>{u.name || "Client"}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] text-cream bg-cream/10 px-1.5 py-0.5 rounded-full border border-cream/30 font-bold">
                              You
                            </span>
                          )}
                        </p>
                        <p className="text-ink/60 text-[11px]">{u.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                          u.role === "SUPER_ADMIN"
                            ? "bg-cream/10 text-cream border-cream/30"
                            : u.role === "ADMIN"
                            ? "bg-cream/10 text-cream border-cream/40"
                            : u.role === "INSTRUCTOR"
                            ? "bg-cream/5 text-cream border-cream/25"
                            : u.role === "SUBSCRIBER"
                            ? "bg-cream/10 text-cream border-cream/30"
                            : "bg-mist text-ink border-mist"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-ink/60">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        disabled={isUpdating}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as Role)}
                        className="px-3 py-1.5 rounded-xl bg-ivory border border-mist text-xs font-medium text-ink focus:outline-none focus:border-gold transition-colors disabled:opacity-50"
                      >
                        <option value="USER">USER (Learner)</option>
                        <option value="SUBSCRIBER">SUBSCRIBER (Circle)</option>
                        <option value="INSTRUCTOR">INSTRUCTOR (Teaches classes)</option>
                        <option value="ADMIN">ADMIN (Instructor)</option>
                        <option value="SUPER_ADMIN">SUPER_ADMIN (Owner)</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Platform-Wide Settings & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-4 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cream" />
            <span>Platform Configurations</span>
          </h2>
          <p className="text-xs text-ink/60 leading-relaxed">
            Control platform operational parameters, booking policies, and feature toggles.
          </p>

          <form onSubmit={handleSaveSetting} className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-ink/70 uppercase font-semibold mb-1">
                  Key
                </label>
                <input
                  type="text"
                  required
                  value={settingKey}
                  onChange={(e) => setSettingKey(e.target.value)}
                  placeholder="e.g. BOOKING_OPEN"
                  className="w-full px-3 py-2 rounded-xl border border-mist focus:border-gold text-xs font-mono bg-ivory/40"
                />
              </div>
              <div>
                <label className="block text-[11px] text-ink/70 uppercase font-semibold mb-1">
                  Value
                </label>
                <input
                  type="text"
                  required
                  value={settingValue}
                  onChange={(e) => setSettingValue(e.target.value)}
                  placeholder="true"
                  className="w-full px-3 py-2 rounded-xl border border-mist focus:border-gold text-xs bg-ivory/40"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingSetting}
              className="w-full py-2.5 rounded-xl bg-cream hover:bg-cream/90 text-black font-semibold text-xs shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSetting ? "Saving Parameter..." : "Save Configuration"}</span>
            </button>
          </form>

          {/* Existing Settings List */}
          <div className="pt-4 border-t border-mist space-y-2">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
              Active Parameters
            </h4>
            {settings.length > 0 ? (
              <div className="space-y-2">
                {settings.map((s) => (
                  <div
                    key={s.id}
                    className="p-3 rounded-xl bg-ivory border border-mist flex items-center justify-between text-xs"
                  >
                    <code className="text-cream font-mono text-[11px] font-semibold">{s.key}</code>
                    <span className="text-ink font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-ink/50 py-2">
                No custom platform overrides set. Standard clinic parameters active.
              </p>
            )}
          </div>
        </div>

        {/* Security & Access Overview */}
        <div className="p-8 sm:p-10 rounded-3xl bg-black-raised/80 backdrop-blur-sm border border-white/[0.07] space-y-4 shadow-sm">
          <h2 className="font-serif text-2xl font-bold text-ink flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-cream" />
            <span>Security Posture & Compliance</span>
          </h2>

          <div className="space-y-3.5 text-xs text-ink/80 pt-2">
            <div className="p-4 rounded-xl bg-ivory border border-mist space-y-1">
              <p className="font-semibold text-ink">Bcrypt Password Encryption</p>
              <p className="text-ink/60 text-[11px] leading-relaxed">
                All accounts and secret class passwords use salt-factored bcrypt hashes. Plaintext credentials are never written to disk or transmitted across responses.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ivory border border-mist space-y-1">
              <p className="font-semibold text-ink">Express Booking Protection</p>
              <p className="text-ink/60 text-[11px] leading-relaxed">
                Guest session bookings are rate-limited to 5 requests per 10 minutes per IP to prevent slot hoarding or spam attempts.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-ivory border border-mist space-y-1">
              <p className="font-semibold text-ink">Strict Role-Based Edge Route Guards</p>
              <p className="text-ink/60 text-[11px] leading-relaxed">
                All `/dashboard/admin` and `/dashboard/super-admin` routes are protected at edge middleware and reinforced within each server route handler.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
