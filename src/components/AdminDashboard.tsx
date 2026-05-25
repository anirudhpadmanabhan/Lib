/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Shield, Building2, CheckSquare, FileText, FileSpreadsheet, Layers } from 'lucide-react';
import { LibraryPartner, BookRequest } from '../types';
import InteractiveSheetEditor from './InteractiveSheetEditor';

interface AdminDashboardProps {
  requests: BookRequest[];
  libraries: LibraryPartner[];
  onRefreshData: () => void;
  booksCount: number;
  rentalsCount: number;
}

export default function AdminDashboard({
  requests,
  libraries,
  onRefreshData,
  booksCount,
  rentalsCount
}: AdminDashboardProps) {
  const [successBanner, setSuccessBanner] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  // Sheet toggle state
  const [activeTab, setActiveTab] = useState<'operations' | 'sheet'>('operations');

  // Multi-table state arrays for admin spreadsheet overview
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminLibraries, setAdminLibraries] = useState<any[]>([]);
  const [adminBooks, setAdminBooks] = useState<any[]>([]);
  const [adminRentals, setAdminRentals] = useState<any[]>([]);
  const [adminRequests, setAdminRequests] = useState<any[]>([]);

  // System audit logs
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; msg: string; time: string }>>([
    { id: 'log_3', msg: 'Admin reviewed and approved Trivandrum Royal partner credentials', time: '10:14 AM' },
    { id: 'log_2', msg: 'System Cron generated late fee penalty notices for 1 active overdue rental logs', time: '09:00 AM' },
    { id: 'log_1', msg: 'Database connection initialized successfully on secure Cloud Run container', time: '07:55 AM' }
  ]);

  // Pull operational database tables
  const loadAdminDatabase = async () => {
    try {
      const modRes = await fetch('/api/admin/moderation');
      if (modRes.ok) {
        const modData = await modRes.json();
        setAdminUsers(modData.users || []);
        setAdminLibraries(modData.libraries || []);
        setAdminRequests(modData.requests || []);
      }

      const bRes = await fetch('/api/books');
      if (bRes.ok) {
        setAdminBooks(await bRes.json());
      }

      const rRes = await fetch('/api/rentals');
      if (rRes.ok) {
        setAdminRentals(await rRes.json());
      }
    } catch (err) {
      console.error("Failed loading full backend schema matrices:", err);
    }
  };

  useEffect(() => {
    loadAdminDatabase();
  }, [booksCount, rentalsCount, requests, libraries]);

  // Handle Verify Library Partner toggling
  const handleToggleVerifyLibrary = async (libId: string) => {
    setIsUpdating(libId);
    try {
      const res = await fetch(`/api/libraries/${libId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        onRefreshData();
        setSuccessBanner('Library verification status updated successfully!');
        // Append system audit
        const activeLibName = libraries.find(l => l.id === libId)?.name || 'Library Partner';
        const newAudit = {
          id: `log_${Date.now()}`,
          msg: `Toggle verification status for partner: "${activeLibName}"`,
          time: new Date().toLocaleTimeString()
        };
        setAuditLogs(prev => [newAudit, ...prev]);
        setTimeout(() => setSuccessBanner(''), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(null);
    }
  };

  // Process User Book Requests
  const handleProcessRequest = async (reqId: string, status: 'Approved' | 'Rejected' | 'Purchased') => {
    try {
      const res = await fetch(`/api/requests/${reqId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        onRefreshData();
        setSuccessBanner(`Sourcing request status moved to ${status}!`);
        // Append audit
        const activeRequestName = requests.find(r => r.id === reqId)?.bookTitle || 'Book Title';
        const newAudit = {
          id: `log_${Date.now()}`,
          msg: `Administrator marked sourcing proposal for "${activeRequestName}" as ${status}`,
          time: new Date().toLocaleTimeString()
        };
        setAuditLogs(prev => [newAudit, ...prev]);
        setTimeout(() => setSuccessBanner(''), 3500);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      
      {/* Modern Admin Header - Bento Card style */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-505 opacity-10 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-indigo-600 rounded-2xl shadow-inner">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-sans text-2xl font-black text-white tracking-tight">Platform Operational Hub</h2>
                <p className="text-xs text-indigo-300 font-mono mt-0.5 uppercase tracking-widest">Super Admin Sandbox Control System</p>
              </div>
            </div>
            <div>
              <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-400/20 px-3.5 py-1.5 rounded-full font-mono font-bold uppercase tracking-wider block text-center">
                ● Superuser Connected
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Modern Tab Toggles for operations vs manual spreadsheets */}
        <div id="admin-toggles-navbar" className="flex space-x-1.5 bg-slate-250 bg-slate-200/50 p-1 rounded-2xl mb-8 overflow-x-auto max-w-max border border-slate-200">
          <button
            id="admin-nav-op-btn"
            onClick={() => setActiveTab('operations')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'operations' ? 'bg-slate-900 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Superuser Operations Panel</span>
          </button>
          
          <button
            id="admin-nav-sheet-btn"
            onClick={() => {
              setActiveTab('sheet');
              loadAdminDatabase();
            }}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'sheet' ? 'bg-indigo-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Interactive Sheet Editor</span>
          </button>
        </div>

        {/* Success message banner */}
        {successBanner && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold font-mono animate-fade">
            ✓ {successBanner}
          </div>
        )}

        {activeTab === 'sheet' ? (
          <InteractiveSheetEditor
            role="PlatformAdmin"
            books={adminBooks}
            rentals={adminRentals}
            users={adminUsers}
            requests={adminRequests}
            libraries={adminLibraries}
            onRefreshData={() => {
              onRefreshData();
              loadAdminDatabase();
            }}
          />
        ) : (
          <>
            {/* Global Bento Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Active Readers</span>
                <div className="text-3xl font-mono font-black mt-2 text-slate-900">1 Resident</div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  Streak log active
                </p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Global Seed Count</span>
                <div className="text-3xl font-mono font-black mt-2 text-indigo-600">{booksCount} Titles</div>
                <p className="text-xs text-slate-400 mt-1.5">Across physical partner shelves</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Ecosystem Leases</span>
                <div className="text-3xl font-mono font-black mt-2 text-slate-905">{rentalsCount} Logs</div>
                <p className="text-xs text-slate-400 mt-1.5">Local door courier routing</p>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Sourcing Pipeline</span>
                <div className="text-3xl font-mono font-black mt-2 text-indigo-650">
                  {requests.filter(r => r.status === 'Pending').length} Pending
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Suggestions of Malayalam literary lore</p>
              </div>
            </div>

            {/* Column splits */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
              
              {/* Sourcing suggestions grid module - Bento Left Card */}
              <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-sans font-black text-slate-900 text-base flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                    <span>Reader Book Suggestions</span>
                  </h3>
                  <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full border border-indigo-100">
                    Sourcing Queue
                  </span>
                </div>

                {requests.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-6 text-center">No user suggestions requested yet.</p>
                ) : (
                  <div className="space-y-4 max-h-120 overflow-y-auto pr-1">
                    {requests.map(req => (
                      <div key={req.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-between hover:border-slate-300 transition-colors">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                              {req.genre}
                            </span>
                            {req.priority && (
                              <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-widest animate-pulse">
                                high priority
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-slate-900 text-sm mt-2">{req.bookTitle}</h4>
                          <p className="text-slate-500 text-[10.5px] mt-0.5">Author: <strong className="text-slate-700">{req.author}</strong></p>
                          
                          {req.personalNote && (
                            <p className="text-[11px] italic text-slate-600 bg-white border border-slate-200/60 p-3 rounded-xl mt-2.5 leading-relaxed">
                              &ldquo;{req.personalNote}&rdquo;
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-mono">Date: {new Date(req.createdAt).toLocaleDateString()}</span>
                          
                          {req.status === 'Pending' ? (
                            <div className="space-x-1.5">
                              <button
                                onClick={() => handleProcessRequest(req.id, 'Approved')}
                                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs cursor-pointer transition-all"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessRequest(req.id, 'Rejected')}
                                className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold cursor-pointer transition-all"
                              >
                                Decline
                              </button>
                            </div>
                          ) : (
                            <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px] bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                              {req.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Side Block with Multi-tenant partner approvals & Audits */}
              <div className="lg:col-span-6 space-y-6">
                
                {/* Library Partners directory - Bento card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-sans font-black text-slate-900 text-base flex items-center space-x-2">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                      <span>Credential Verifications</span>
                    </h3>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                      Partner Nodes
                    </span>
                  </div>

                  <div className="space-y-3">
                    {libraries.map(lib => (
                      <div key={lib.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between gap-3 border border-slate-200/50 hover:border-slate-300 transition-colors">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl p-2 bg-white rounded-xl border border-slate-200 shadow-xs">{lib.logo}</span>
                          <div>
                            <h4 className="font-serif font-bold text-slate-850 text-sm text-slate-950">{lib.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{lib.location}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleVerifyLibrary(lib.id)}
                          disabled={isUpdating === lib.id}
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-xl cursor-pointer transition-all ${
                            lib.isVerified 
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300' 
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                        >
                          {lib.isVerified ? '✓ Verified' : 'Approve Partner'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Logs telemetry - Bento Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                    <h3 className="font-sans font-black text-slate-900 text-base flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <span>Interactive Audit Logger</span>
                    </h3>
                    <span className="text-[9px] bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 font-mono font-black rounded-full uppercase tracking-wider animate-pulse">
                      Live Terminal
                    </span>
                  </div>

                  <div className="font-mono text-[10.5px] text-slate-500 space-y-2 max-h-48 overflow-y-auto pr-1">
                    {auditLogs.map(log => (
                      <div key={log.id} className="pb-2 border-b border-slate-100/60 last:border-b-0 flex items-start justify-between gap-1.5">
                        <span className="leading-relaxed text-slate-600 font-mono">&gt; {log.msg}</span>
                        <span className="text-[9.5px] text-indigo-500 font-bold flex-shrink-0">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </>
        )}

      </div>
    </div>
  );
}
