/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import SplashOnboarding from './components/SplashOnboarding';
import RoleSwitcher from './components/RoleSwitcher';
import ReaderDashboard from './components/ReaderDashboard';
import LibraryDashboard from './components/LibraryDashboard';
import AdminDashboard from './components/AdminDashboard';
import ProfileBar from './components/ProfileBar';
import { Book, Rental, AppNotification, WalletTransaction, BookRequest, User, LibraryPartner } from './types';
import { BookOpen, ShieldAlert, RefreshCw } from 'lucide-react';

export default function App() {
  // Splash Screen toggle
  const [showSplash, setShowSplash] = useState(true);

  // Active Sandbox Role
  const [currentRole, setCurrentRole] = useState<'Reader' | 'LibraryPartner' | 'PlatformAdmin'>('Reader');

  // Multi-tenant branch ID for library partner dashboard
  const [selectedLibraryId, setSelectedLibraryId] = useState('lib_1');

  // Global Library selection state designed to hook with our custom Profile Bar
  const [globalLibraryFilter, setGlobalLibraryFilter] = useState('All');

  // Backend state elements
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [requests, setRequests] = useState<BookRequest[]>([]);
  const [libraries, setLibraries] = useState<LibraryPartner[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronize data from Express full-stack API routes
  const refreshBackendData = async () => {
    try {
      const [uRes, bRes, rRes, nRes, tRes, reqRes, lRes] = await Promise.all([
        fetch('/api/user'),
        fetch('/api/books'),
        fetch('/api/rentals'),
        fetch('/api/notifications'),
        fetch('/api/wallet/transactions'),
        fetch('/api/requests'),
        fetch('/api/libraries')
      ]);

      const [uData, bData, rData, nData, tData, reqData, lData] = await Promise.all([
        uRes.json(),
        bRes.json(),
        rRes.json(),
        nRes.json(),
        tRes.json(),
        reqRes.json(),
        lRes.json()
      ]);

      setUser(uData);
      setBooks(bData);
      setRentals(rData);
      setNotifications(nData);
      setTransactions(tData);
      setRequests(reqData);
      setLibraries(lData);
    } catch (err) {
      console.error("Express backend load failed (falling back to mocked state):", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshBackendData();
    // Poll data every 7 seconds to keep multiple logged screens perfectly collaborative!
    const pollId = setInterval(refreshBackendData, 7000);
    return () => clearInterval(pollId);
  }, []);

  if (showSplash) {
    return <SplashOnboarding onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between text-slate-900">
      
      {/* Topmost Brand Master Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setShowSplash(true)}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white border border-indigo-400 shadow-sm">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-black text-slate-900 tracking-tight leading-none animate-pulse">
                LIB <span className="text-indigo-600 font-bold text-lg">&mdash; ലിബ്</span>
              </h1>
              <p className="text-[10px] tracking-widest uppercase text-slate-400 font-mono font-bold mt-0.5">
                Malayalam Online Library Delivery Ecosystem
              </p>
            </div>
          </div>

          {/* Theme display credits */}
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <span>Bento Grid Premium UI Theme</span>
            <div className="flex space-x-1">
              <span className="h-3 w-3 rounded-full bg-slate-900" title="Slate Black"></span>
              <span className="h-3 w-3 rounded-full bg-indigo-600" title="Indigo Primary"></span>
              <span className="h-3 w-3 rounded-full bg-slate-200" title="Soft Slate Accent"></span>
              <span className="h-3 w-3 rounded-full bg-emerald-500" title="System Live"></span>
            </div>
          </div>
        </div>
      </header>

      {/* Modern Top Page Profile Bar containing location-wise registered library search */}
      <ProfileBar
        user={user}
        currentRole={currentRole}
        selectedLibraryId={selectedLibraryId}
        libraries={libraries}
        onSelectLibrary={(libraryId) => {
          setGlobalLibraryFilter(libraryId);
          setCurrentRole('Reader'); // Guide user to the reader bookshelf view
        }}
      />

      {/* Persistent Sandbox Mode Selector */}
      <RoleSwitcher
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        selectedLibraryId={selectedLibraryId}
        onLibraryChange={setSelectedLibraryId}
        libraries={libraries.map(l => ({ id: l.id, name: l.name }))}
      />

      {/* Main Core Body Router content */}
      <main className="flex-grow">
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-mono text-slate-400 mt-2">Loading core library assets catalog...</p>
          </div>
        ) : (
          <React.Fragment>
            {currentRole === 'Reader' && user && (
              <ReaderDashboard
                user={user}
                books={books}
                rentals={rentals}
                notifications={notifications}
                transactions={transactions}
                requests={requests}
                libraries={libraries}
                onRefreshData={refreshBackendData}
                globalLibraryFilter={globalLibraryFilter}
                setGlobalLibraryFilter={setGlobalLibraryFilter}
              />
            )}

            {currentRole === 'LibraryPartner' && (
              <LibraryDashboard
                libraryId={selectedLibraryId}
                books={books}
                rentals={rentals}
                libraries={libraries}
                onRefreshData={refreshBackendData}
              />
            )}

            {currentRole === 'PlatformAdmin' && (
              <AdminDashboard
                requests={requests}
                libraries={libraries}
                onRefreshData={refreshBackendData}
                booksCount={books.length}
                rentalsCount={rentals.length}
              />
            )}
          </React.Fragment>
        )}
      </main>

      {/* Bento Minimalist Footer */}
      <footer className="bg-slate-900 text-slate-400 text-center py-6 border-t border-slate-800 text-[11px] font-mono mt-12">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="text-indigo-400 font-bold font-serif">മലയാള സാഹിത്യം നിങ്ങളുടെ വീട്ടുവാതിൽക്കൽ &bull; Malayalam Literature Delivered to Your Doorstep</p>
          <p>&copy; 2026 LIB Delivery Ecosystem &bull; Styled with Ultra-Modern Bento Grid Design Theme</p>
        </div>
      </footer>

    </div>
  );
}
