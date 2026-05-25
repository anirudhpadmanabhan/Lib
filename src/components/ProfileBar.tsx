/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User as UserIcon, Wallet, MapPin, Search, CheckCircle2, ShieldCheck, 
  Building, BookOpen, Map, HelpCircle, Landmark, Star, HelpCircle as HelpIcon 
} from 'lucide-react';
import { User, LibraryPartner } from '../types';

interface ProfileBarProps {
  user: User | null;
  currentRole: 'Reader' | 'LibraryPartner' | 'PlatformAdmin';
  selectedLibraryId?: string;
  libraries: LibraryPartner[];
  onSelectLibrary?: (libraryId: string) => void;
  onSetReaderTab?: (tab: 'explore' | 'wishlist' | 'ledger' | 'wallet' | 'requests') => void;
}

export default function ProfileBar({
  user,
  currentRole,
  selectedLibraryId,
  libraries,
  onSelectLibrary,
  onSetReaderTab
}: ProfileBarProps) {
  const [locQuery, setLocQuery] = useState('');
  const [showResults, setShowResults] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  // Search registered libraries by location (case-insensitive)
  const matchedLibraries = libraries.filter(lib => {
    if (!locQuery.trim()) return false;
    const query = locQuery.toLowerCase();
    const matchLoc = lib.location.toLowerCase().includes(query);
    const matchZones = lib.deliveryZones.some(zone => zone.toLowerCase().includes(query));
    const matchName = lib.name.toLowerCase().includes(query);
    return matchLoc || matchZones || matchName;
  });

  // Get active user details
  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'Literary Patron': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Premium': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-slate-100 text-slate-705 border-slate-200';
    }
  };

  return (
    <div id="profile-bar-container" className="max-w-7xl mx-auto px-6 w-full mt-4">
      <div 
        id="profile-bar-bento" 
        className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow grid grid-cols-1 lg:grid-cols-12 gap-5"
      >
        {/* Left Side: Profile Identifier & Metadata */}
        <div id="profile-bar-identity" className="lg:col-span-5 flex flex-col justify-between border-slate-100 lg:border-r lg:pr-6 gap-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black shadow-sm flex-shrink-0">
                {currentRole === 'Reader' && user ? (
                  <span className="text-md font-sans">{user.name.charAt(0)}</span>
                ) : currentRole === 'LibraryPartner' ? (
                  <Landmark className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-[10px] bg-slate-100 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded font-mono">
                    PROFILE BAR
                  </span>
                  {currentRole === 'Reader' && user && (
                    <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${getBadgeColor(user.membershipStatus)}`}>
                      {user.membershipStatus}
                    </span>
                  )}
                </div>
                <h3 className="font-sans font-black text-slate-800 text-base leading-tight mt-1">
                  {currentRole === 'Reader' && user ? (
                    <span>{user.name} &bull; <span className="text-indigo-600">Active Reader</span></span>
                  ) : currentRole === 'LibraryPartner' ? (
                    <span>Partner Portal &bull; Branch #{selectedLibraryId}</span>
                  ) : (
                    <span>System Owner &bull; Platform Administrator</span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {currentRole === 'Reader' && user ? user.email : 'Global Multi-Tenant Supervision Node'}
                </p>
              </div>
            </div>
          </div>

          {/* Profile Dropdown Button representing current state */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between w-full relative">
            {currentRole === 'Reader' && user ? (
              <div className="relative w-full">
                <button
                  id="profile-dropdown-trigger"
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-full flex items-center justify-between bg-slate-50 hover:bg-slate-150 border border-slate-250 border-slate-200 p-2.5 px-4 rounded-xl transition-all cursor-pointer text-slate-700 font-sans text-xs font-bold"
                >
                  <div className="flex items-center space-x-2">
                    <UserIcon className="w-4 h-4 text-indigo-600" />
                    <span>View Profile Details</span>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-white border border-slate-200/60 shadow-xs px-2.5 py-1 rounded-lg">
                    <span className="text-[10px] text-amber-600 font-bold">⚡ {user.streak} Days</span>
                    <span className="text-[10px] text-indigo-700 font-black font-mono">₹{user.walletBalance.toFixed(2)}</span>
                    <span className="text-slate-400 text-[9px] ml-0.5">▼</span>
                  </div>
                </button>

                {showDropdown && (
                  <div id="profile-dropdown-content" className="absolute left-0 right-0 z-50 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-4 space-y-4 animate-in fade-in duration-200">
                    {/* User Identity Header */}
                    <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-sm">
                        {user.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-slate-800 text-xs truncate">{user.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {/* Wallet */}
                      <button 
                        id="profile-dropdown-wallet"
                        onClick={() => {
                          if (onSetReaderTab) onSetReaderTab('wallet');
                          window.dispatchEvent(new CustomEvent('set-reader-tab', { detail: 'wallet' }));
                          setShowDropdown(false);
                        }}
                        className="bg-slate-50 hover:bg-indigo-50/40 p-2.5 rounded-xl text-left border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer w-full"
                      >
                        <div className="flex items-center space-x-1 text-slate-400">
                          <Wallet className="w-3 h-3 text-indigo-500" />
                          <span className="text-[8px] font-bold uppercase tracking-wider">Wallet Balance</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-800 mt-1">₹{user.walletBalance.toFixed(2)}</div>
                      </button>

                      {/* Streak */}
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 w-full">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <span>⚡</span>
                          <span className="text-[8px] font-bold uppercase tracking-wider">Reading Streak</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-slate-800 mt-1">{user.streak} Days Active</div>
                      </div>
                    </div>

                    {/* Quick navigation links */}
                    <div className="space-y-1.5 pt-1">
                      <button
                        id="profile-dropdown-ledgers"
                        onClick={() => {
                          if (onSetReaderTab) onSetReaderTab('ledger');
                          window.dispatchEvent(new CustomEvent('set-reader-tab', { detail: 'ledger' }));
                          setShowDropdown(false);
                        }}
                        className="w-full text-left bg-slate-50 hover:bg-slate-200/60 p-2.5 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                          <span>History &amp; My Ledgers</span>
                        </span>
                        <span className="text-slate-400">→</span>
                      </button>

                      <button
                        id="profile-dropdown-addcoins"
                        onClick={() => {
                          if (onSetReaderTab) onSetReaderTab('wallet');
                          window.dispatchEvent(new CustomEvent('set-reader-tab', { detail: 'wallet' }));
                          setShowDropdown(false);
                        }}
                        className="w-full text-left bg-slate-50 hover:bg-slate-200/60 p-2.5 rounded-xl text-[11px] font-bold text-slate-700 flex items-center justify-between border border-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                      >
                        <span className="flex items-center space-x-1.5">
                          <Wallet className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Manage Purse / Add Coins</span>
                        </span>
                        <span className="text-slate-400">→</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-100/80 p-2.5 rounded-xl w-full">
                <span className="text-[10px] text-slate-500 block leading-tight font-sans">
                   You are logged in as {currentRole === 'LibraryPartner' ? 'Cherukad / Partner Branch Manager' : 'Platform System Owner'}. Switches can be processed using the Sandbox Switcher below.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Geolocation Search Hub for Registered Libraries */}
        <div id="profile-bar-geo-search" className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-sans font-black text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Map className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
                <span>Geographic Network &bull; Find Branches Registered in Kerala</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                {libraries.length} active partners
              </span>
            </div>

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-rose-500" />
              <input
                id="library-location-search-input"
                type="text"
                value={locQuery}
                aria-label="Search library by location"
                onChange={(e) => {
                  setLocQuery(e.target.value);
                  setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Search registered libraries by location (e.g. Kozhikode, Kannur, Kottayam, Trivandrum)..."
                className="w-full bg-slate-50 hover:bg-slate-100/40 border border-slate-200 pl-10 pr-24 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:scale-[1.005] focus:scale-[1.01] text-slate-900 transition-all duration-300 ease-in-out"
              />
              {locQuery && (
                <button 
                  id="library-clear-search-btn"
                  onClick={() => {
                    setLocQuery('');
                    setShowResults(false);
                  }} 
                  className="absolute right-3 top-2.5 text-[10px] uppercase font-bold text-slate-400 hover:text-indigo-600 bg-white shadow-xs border border-slate-100 px-2 py-1 rounded-md transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Inline matched results space */}
          <div id="library-matched-results-box" className="mt-3">
            {showResults && locQuery.trim() !== '' ? (
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 max-h-[170px] overflow-y-auto space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-b border-slate-200 pb-1.5">
                  <span>Match Results ({matchedLibraries.length} branches found)</span>
                  <button onClick={() => { setShowResults(false); setLocQuery(''); }} className="text-[9px] hover:text-black uppercase font-bold">Close Panel</button>
                </div>
                {matchedLibraries.length === 0 ? (
                  <div className="text-center py-4 text-xs font-mono text-slate-400">
                    ⚠️ No registered library matches "{locQuery}". Search "Kottayam", "Trivandrum", "Kozhikode", or "Kannur"!
                  </div>
                ) : (
                  matchedLibraries.map(lib => (
                    <div 
                      key={lib.id} 
                      className="bg-white p-2.5 rounded-xl border border-slate-100 hover:border-indigo-300 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center space-x-2.5 overflow-hidden">
                        <span className="text-lg bg-indigo-50 p-1.5 rounded-lg flex-shrink-0">{lib.logo}</span>
                        <div className="overflow-hidden">
                          <h5 className="font-sans font-bold text-slate-800 flex items-center gap-1.5 truncate">
                            <span>{lib.name}</span>
                            {lib.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-indigo-605 text-indigo-600" />}
                          </h5>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                            <span>{lib.location}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex items-center gap-3">
                        <div className="hidden sm:block">
                          <div className="text-[10px] font-bold text-slate-700 font-mono">
                            {lib.collectionSize} books
                          </div>
                          <div className="text-[9px] text-slate-400 flex items-center justify-end gap-0.5 mt-0.5">
                            <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            <span>{lib.rating}</span>
                          </div>
                        </div>
                        {onSelectLibrary && (
                          <button
                            onClick={() => {
                              onSelectLibrary(lib.id);
                              setLocQuery('');
                              setShowResults(false);
                              if (onSetReaderTab) onSetReaderTab('explore');
                            }}
                            className="bg-indigo-600 hover:bg-slate-900 text-white font-bold text-[9px] uppercase px-2.5 py-1.5 rounded-lg transition-all shadow-xs cursor-pointer"
                          >
                            Explore Books
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="text-[11px] text-slate-450 text-slate-500 italic flex items-center gap-1.5 pt-2 lg:pt-0">
                <span>💭</span>
                <span>Type standard locations (such as <strong className="text-indigo-600 not-italic">"Kannur"</strong>, <strong className="text-indigo-600 not-italic">"Trivandrum"</strong>, <strong className="text-indigo-600 not-italic">"Kozhikode"</strong> or <strong className="text-indigo-600 not-italic">"Kottayam"</strong>) to find and explore customized community shelves.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
