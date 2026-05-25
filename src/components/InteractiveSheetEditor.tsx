/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Save, PlusCircle, Trash2, ArrowUpDown, Search, 
  HelpCircle, AlertCircle, RefreshCw, Layers 
} from 'lucide-react';

interface InteractiveSheetEditorProps {
  libraryId?: string; // If provided, limits scope to single library
  role: 'LibraryPartner' | 'PlatformAdmin';
  books: any[];
  rentals: any[];
  users?: any[];
  requests?: any[];
  libraries?: any[];
  onRefreshData: () => void;
}

type TableChoice = 'books' | 'rentals' | 'users' | 'requests' | 'libraries';

export default function InteractiveSheetEditor({
  libraryId,
  role,
  books,
  rentals,
  users = [],
  requests = [],
  libraries = [],
  onRefreshData
}: InteractiveSheetEditorProps) {
  // Available tables based on role
  const availableTables: { value: TableChoice; label: string; desc: string }[] = role === 'PlatformAdmin' 
    ? [
        { value: 'books', label: 'Books Database', desc: 'Manage all global titles, genres, and stock levels.' },
        { value: 'rentals', label: 'Rentals & Leases', desc: 'Track door-step leases, due dates, and courier statuses.' },
        { value: 'users', label: 'Ecosystem Users', desc: 'Edit member names, email IDs, wallet balances, and streaks.' },
        { value: 'requests', label: 'Sourcing Requests', desc: 'Review reader suggestions and queue status.' },
        { value: 'libraries', label: 'Partner Branches', desc: 'Authorize credentials and coordinate delivery networks.' }
      ]
    : [
        { value: 'books', label: 'My Branch Shelf', desc: 'Manage your local books collection and shelf locations.' },
        { value: 'rentals', label: 'My Local Dispatches', desc: 'Track dispatches, returns, and overdue fees for this branch.' }
      ];

  const [activeTable, setActiveTable] = useState<TableChoice>('books');
  const [gridData, setGridData] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Define column definitions for each table
  interface ColumnDef {
    key: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'dropdown';
    options?: string[];
    readOnly?: boolean;
    placeholder?: string;
  }

  const columnsMap: Record<TableChoice, ColumnDef[]> = {
    books: [
      { key: 'id', label: 'Book ID', type: 'text', readOnly: true },
      { key: 'shelfLocation', label: 'Shelf Code', type: 'text', placeholder: 'e.g. A-12' },
      { key: 'titleMalayalam', label: 'Malayalam Title', type: 'text', placeholder: 'e.g. ബാല്യകാലസഖി' },
      { key: 'author', label: 'Author', type: 'text', placeholder: 'e.g. Vaikom Muhammad Basheer' },
      { key: 'genre', label: 'Genre Category', type: 'dropdown', options: ['Novels', 'Poetry', 'Thriller', 'History', 'Biography', 'Drama', 'Spiritual', 'Political', 'Cinema', 'Science', 'Philosophy'] },
      { key: 'rentalPrice', label: 'Rs.', type: 'number', placeholder: 'e.g. 10' },
      { key: 'language', label: 'Language', type: 'text', placeholder: 'e.g. Malayalam' },
      { key: 'titleEnglish', label: 'English Title', type: 'text', placeholder: 'e.g. Balyakalasakhi' },
      { key: 'totalCopies', label: 'Total Stock', type: 'number' },
      { key: 'availableCopies', label: 'Avail copies', type: 'number' },
      { key: 'libraryId', label: 'Library Node', type: 'text', readOnly: role === 'LibraryPartner' },
      { key: 'publicationDetails', label: 'Publisher Info', type: 'text', placeholder: 'e.g. DC Books, 1944' },
      { key: 'isRare', label: 'Rare Collector', type: 'boolean' }
    ],
    rentals: [
      { key: 'id', label: 'Rental ID', type: 'text', readOnly: true },
      { key: 'userId', label: 'Reader ID', type: 'text' },
      { key: 'bookId', label: 'Book ID', type: 'text' },
      { key: 'libraryId', label: 'Library Node', type: 'text', readOnly: role === 'LibraryPartner' },
      { key: 'rentedDate', label: 'Lease Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'dueDate', label: 'Expiry Date', type: 'text', placeholder: 'YYYY-MM-DD' },
      { key: 'returnedDate', label: 'Return Date', type: 'text', placeholder: 'YYYY-MM-DD (or blank)' },
      { key: 'status', label: 'Courier Status', type: 'dropdown', options: ['Requested', 'Dispatched', 'Delivered', 'Returned', 'Overdue'] },
      { key: 'lateFeeCharged', label: 'Late Charges (₹)', type: 'number' },
      { key: 'trackingCode', label: 'Tracking Code', type: 'text' }
    ],
    users: [
      { key: 'id', label: 'Member ID', type: 'text', readOnly: true },
      { key: 'name', label: 'Legal Name', type: 'text' },
      { key: 'email', label: 'Primary Email', type: 'text' },
      { key: 'phone', label: 'Contact Cell', type: 'text' },
      { key: 'walletBalance', label: 'Wallet Balance (₹)', type: 'number' },
      { key: 'membershipStatus', label: 'Status Tier', type: 'dropdown', options: ['Standard', 'Premium', 'Literary Patron'] },
      { key: 'streak', label: 'Streak Days', type: 'number' }
    ],
    requests: [
      { key: 'id', label: 'Request ID', type: 'text', readOnly: true },
      { key: 'userId', label: 'User ID', type: 'text' },
      { key: 'bookTitle', label: 'Suggested Title', type: 'text' },
      { key: 'author', label: 'Author Name', type: 'text' },
      { key: 'genre', label: 'Proposed Genre', type: 'text' },
      { key: 'personalNote', label: 'Reader Context', type: 'text' },
      { key: 'priority', label: 'Priority Escalated', type: 'boolean' },
      { key: 'status', label: 'Sourcing Status', type: 'dropdown', options: ['Pending', 'Approved', 'Purchased', 'Rejected'] }
    ],
    libraries: [
      { key: 'id', label: 'Partner ID', type: 'text', readOnly: true },
      { key: 'name', label: 'Branch Name', type: 'text' },
      { key: 'ownerName', label: 'Custodian Name', type: 'text' },
      { key: 'email', label: 'Official Email', type: 'text' },
      { key: 'location', label: 'Address/Base', type: 'text' },
      { key: 'rating', label: 'Reputation', type: 'number' },
      { key: 'collectionSize', label: 'Shelf Count', type: 'number' },
      { key: 'isVerified', label: 'Accreditation Status', type: 'boolean' }
    ]
  };

  // Load relevant data into local sheet array based on role and library boundaries
  const loadDataToGrid = () => {
    setErrorMsg('');
    setSuccessMsg('');
    let list: any[] = [];
    if (activeTable === 'books') {
      list = role === 'LibraryPartner' && libraryId
        ? books.filter(b => b.libraryId === libraryId)
        : books;
    } else if (activeTable === 'rentals') {
      list = role === 'LibraryPartner' && libraryId
        ? rentals.filter(r => r.libraryId === libraryId)
        : rentals;
    } else if (activeTable === 'users') {
      list = users;
    } else if (activeTable === 'requests') {
      list = requests;
    } else if (activeTable === 'libraries') {
      list = libraries;
    }

    // Clone deep to prevent dynamic state drift before click Save
    setGridData(JSON.parse(JSON.stringify(list)));
  };

  // Trigger loading when tab changes
  useEffect(() => {
    loadDataToGrid();
  }, [activeTable, books, rentals, users, requests, libraries]);

  // Handle value change inside sheet cells
  const handleCellValueChange = (rowIndex: number, key: string, val: any, type: string) => {
    const updated = [...gridData];
    let typedValue = val;
    if (type === 'number') {
      typedValue = val === '' ? 0 : Number(val);
    } else if (type === 'boolean') {
      typedValue = Boolean(val);
    }
    updated[rowIndex][key] = typedValue;

    // Dual-link Shelf Code & shelfLocation to prevent references drift
    if (key === 'shelfLocation') {
      updated[rowIndex]['shelfCode'] = typedValue;
    } else if (key === 'shelfCode') {
      updated[rowIndex]['shelfLocation'] = typedValue;
    }

    setGridData(updated);
  };

  // Append new blank record row
  const handleAddBlankRow = () => {
    const columns = columnsMap[activeTable];
    const newRecord: any = { id: `${activeTable.substring(0,4)}_${Date.now()}` };
    
    columns.forEach(col => {
      if (col.key === 'id') return;
      if (col.key === 'libraryId' && role === 'LibraryPartner' && libraryId) {
        newRecord[col.key] = libraryId;
      } else if (col.type === 'number') {
        newRecord[col.key] = 0;
      } else if (col.type === 'boolean') {
        newRecord[col.key] = false;
      } else if (col.type === 'dropdown' && col.options) {
        newRecord[col.key] = col.options[0];
      } else {
        newRecord[col.key] = '';
      }
    });

    if (activeTable === 'books') {
      newRecord.language = 'Malayalam';
      newRecord.rentalPrice = 10;
      newRecord.totalCopies = 5;
      newRecord.availableCopies = 5;
      newRecord.coverImage = 'linear-gradient(135deg, #3E5879 0%, #1c2d42 100%)';
      newRecord.description = 'A classic work of Malayalam literature.';
      newRecord.descriptionMalayalam = 'മലയാള സാഹിത്യത്തിലെ മികച്ച കൃതി.';
      newRecord.rating = 5.0;
      newRecord.reviewsCount = 0;
      newRecord.shelfLocation = 'A-01';
      newRecord.shelfCode = 'A-01';
    }

    setGridData([newRecord, ...gridData]);
  };

  // Delete row locally
  const handleDeleteRow = (index: number) => {
    const updated = [...gridData];
    updated.splice(index, 1);
    setGridData(updated);
  };

  // Save changes to backend via our newly designed Sheet POST Endpoint
  const handleSaveChanges = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/sheet/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: activeTable,
          data: gridData,
          libraryId: role === 'LibraryPartner' ? libraryId : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`🌱 Sheet saved successfully! Commited ${data.count} backend records safely.`);
        onRefreshData();
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        setErrorMsg(data.error || 'Server rejected manual database save operation.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Network error: Could not overwrite backend variables.');
    } finally {
      setSaving(false);
    }
  };

  // Local matching filter for spreadsheet cells
  const filteredGridData = gridData.filter(row => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return Object.values(row).some(val => 
      String(val).toLowerCase().includes(query)
    );
  });

  return (
    <div id="sheet-main-bento" className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      {/* Tab select and instructions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-rose-100/10 border-slate-100 pb-5 gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-600 shadow-sm flex-shrink-0 animate-pulse">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded border border-indigo-200/50 tracking-wider font-mono">
                MALAYALAM LITERARY SHEET v2.5
              </span>
              <span className="text-[10px] bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                Direct Back-end Edit Mode active
              </span>
            </div>
            <h3 className="font-sans font-black text-slate-900 text-lg leading-tight mt-1.5 flex items-center gap-1.5">
              <span>Interactive Database Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 leading-normal max-w-2xl">
              Modify global and tenant schemas inside an Excel-style reactive grid. Double-click or type inside cells and hit [Save changes to disk] to persist directly to database.
            </p>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadDataToGrid}
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Grid</span>
          </button>
          
          <button
            onClick={handleAddBlankRow}
            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 text-xs px-3.5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Insert Row</span>
          </button>

          <button
            onClick={handleSaveChanges}
            disabled={saving}
            className="bg-emerald-650 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>Save Sheet to Disk</span>
          </button>
        </div>
      </div>

      {/* Sheet selector rails */}
      <div className="flex space-x-1 border-b border-slate-100 overflow-x-auto py-3">
        {availableTables.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTable(tab.value)}
            className={`px-4 py-2 text-xs font-bold transition-all rounded-lg whitespace-nowrap cursor-pointer ${
              activeTable === tab.value
                ? 'bg-slate-900 text-white font-black shadow-xs'
                : 'text-slate-500 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 border-b border-slate-105 p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-[11px] font-mono text-slate-500 italic">
          💡 Editing: <strong className="text-slate-900 not-italic">{availableTables.find(t=>t.value===activeTable)?.desc}</strong>
        </span>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            aria-label="Search within sheet database cells"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Regex match or text filter..."
            className="w-full bg-white border border-slate-200 pl-9 pr-4 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
          />
        </div>
      </div>

      {/* Validation Banner Space */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-mono my-3 rounded-xl flex items-center gap-2">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold font-mono my-3 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Spreadsheets Body Layout */}
      <div className="relative border border-slate-200 rounded-2xl overflow-hidden mt-4 bg-white">
        <div className="max-h-[500px] overflow-auto">
          <table className="w-full text-left border-collapse table-fixed select-text">
            {/* Headers Row */}
            <thead className="sticky top-0 z-10 bg-slate-100 text-[11px] text-slate-600 font-mono tracking-wider text-center select-none uppercase shadow-xs">
              <tr>
                {/* Index numbering box */}
                <th className="w-12 border-r border-b border-slate-200 bg-slate-200 p-2 font-mono text-[9px]">Row</th>
                {columnsMap[activeTable].map(col => (
                  <th 
                    key={col.key} 
                    className="w-44 border-r border-b border-slate-200 p-2 text-xs font-semibold text-slate-700 bg-slate-150/80 bg-slate-100 text-left font-sans truncate"
                  >
                    <span>{col.label}</span>
                    <span className="block text-[9px] font-mono text-slate-400 font-normal leading-tight">&bull; {col.key}</span>
                  </th>
                ))}
                {/* Actions */}
                <th className="w-16 border-b border-slate-200 uppercase bg-slate-100 p-2"></th>
              </tr>
            </thead>

            {/* Grid Body Rows */}
            <tbody className="divide-y divide-slate-150 text-xs font-sans">
              {filteredGridData.length === 0 ? (
                <tr>
                  <td colSpan={columnsMap[activeTable].length + 2} className="text-center py-12 text-slate-450 text-slate-400 font-mono italic">
                    📭 Empty dataset. Hit [Insert Row] above to design your customized record!
                  </td>
                </tr>
              ) : (
                filteredGridData.map((row, rowIndex) => (
                  <tr key={row.id || rowIndex} className="hover:bg-indigo-50/15 group transition-colors odd:bg-white even:bg-slate-50/40">
                    {/* Index header cell */}
                    <td className="border-r border-slate-205 border-slate-200 text-center font-mono text-[10px] bg-slate-100 text-slate-400 select-none">
                      {rowIndex + 1}
                    </td>

                    {/* Form-bound Columns */}
                    {columnsMap[activeTable].map(col => {
                      const val = row[col.key];

                      return (
                        <td key={col.key} className="p-1 border-r border-slate-200 align-middle">
                          {col.readOnly ? (
                            <div className="px-2 py-1.5 font-mono text-[10.5px] text-slate-400 bg-slate-50 rounded select-all truncate max-w-full">
                              {String(val || '')}
                            </div>
                          ) : col.type === 'boolean' ? (
                            <div className="flex justify-center items-center py-1">
                              <input
                                type="checkbox"
                                checked={!!val}
                                aria-label={`Toggle ${col.label}`}
                                onChange={(e) => handleCellValueChange(rowIndex, col.key, e.target.checked, 'boolean')}
                                className="w-4.5 h-4.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                              />
                            </div>
                          ) : col.type === 'dropdown' && col.options ? (
                            <select
                              value={val || ''}
                              aria-label={`Select ${col.label}`}
                              onChange={(e) => handleCellValueChange(rowIndex, col.key, e.target.value, 'dropdown')}
                              className="w-full bg-slate-50 border border-slate-200 py-1.5 px-2.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                            >
                              {col.options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type === 'number' ? 'number' : 'text'}
                              value={val === undefined || val === null ? '' : val}
                              aria-label={`Edit ${col.label}`}
                              placeholder={col.placeholder || '-'}
                              onChange={(e) => handleCellValueChange(rowIndex, col.key, e.target.value, col.type)}
                              className="w-full bg-transparent hover:bg-slate-100/30 font-sans font-medium hover:border-slate-300 px-2.5 py-1 text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 border border-transparent rounded-lg transition-colors"
                            />
                          )}
                        </td>
                      );
                    })}

                    {/* Delete actions grid cell */}
                    <td className="p-1 text-center align-middle">
                      <button
                        onClick={() => handleDeleteRow(rowIndex)}
                        title="Remove row"
                        className="p-1.5 hover:bg-rose-550 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
