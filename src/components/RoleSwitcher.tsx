/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserCircle, Shield, Building2 } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: 'Reader' | 'LibraryPartner' | 'PlatformAdmin';
  onRoleChange: (role: 'Reader' | 'LibraryPartner' | 'PlatformAdmin') => void;
  selectedLibraryId: string;
  onLibraryChange: (libId: string) => void;
  libraries: Array<{ id: string; name: string }>;
}

export default function RoleSwitcher({
  currentRole,
  onRoleChange,
  selectedLibraryId,
  onLibraryChange,
  libraries
}: RoleSwitcherProps) {
  return (
    <div className="bg-slate-950 text-slate-100 border-b border-slate-800 px-4 py-2.5 z-50">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left Side: Indicator */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">
            Ecosystem Sandbox Control
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>

        {/* Middle: Role select controls */}
        <div className="flex flex-wrap items-center justify-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => onRoleChange('Reader')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
              currentRole === 'Reader'
                ? 'bg-indigo-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCircle className="w-3.5 h-3.5" />
            <span>Reader Mode</span>
          </button>

          <button
            onClick={() => onRoleChange('LibraryPartner')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
              currentRole === 'LibraryPartner'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700 shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Library Partner</span>
          </button>

          <button
            onClick={() => onRoleChange('PlatformAdmin')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 cursor-pointer ${
              currentRole === 'PlatformAdmin'
                ? 'bg-emerald-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Platform Admin</span>
          </button>
        </div>

        {/* Right Side: Library Partner selection dropdown (only relevant if in Library Partner mode) */}
        {currentRole === 'LibraryPartner' ? (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Managing Branch:</span>
            <select
              value={selectedLibraryId}
              onChange={(e) => onLibraryChange(e.target.value)}
              className="bg-slate-900 text-white border border-slate-700 rounded-lg py-1 px-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-xs font-semibold"
            >
              {libraries.map((lib) => (
                <option key={lib.id} value={lib.id}>
                  {lib.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden sm:flex text-[11px] font-mono text-indigo-400 font-bold">
            Testing active features locally &bull; Real Database Sync
          </div>
        )}
      </div>
    </div>
  );
}
