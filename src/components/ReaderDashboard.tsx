/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, BookOpen, Heart, Star, Wallet, CreditCard, ChevronRight, 
  MapPin, Clock, CheckCircle2, ChevronLeft, ArrowRight, Share2, 
  AlertTriangle, RefreshCw, Send, Trash2, Calendar, FileText, Bell, Sparkles
} from 'lucide-react';
import { Book, Rental, Review, BookRequest, WalletTransaction, AppNotification, User } from '../types';

interface ReaderDashboardProps {
  user: User;
  books: Book[];
  rentals: Rental[];
  notifications: AppNotification[];
  transactions: WalletTransaction[];
  requests: BookRequest[];
  libraries: any[];
  onRefreshData: () => void;
  globalLibraryFilter?: string;
  setGlobalLibraryFilter?: (val: string) => void;
}

const getBookCoverBackground = (coverImage?: string): string => {
  if (!coverImage) return 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)';
  if (coverImage.startsWith('http') || coverImage.startsWith('data:image')) {
    return `url("${coverImage}") center/cover no-repeat`;
  }
  return coverImage;
};

export default function ReaderDashboard({
  user,
  books,
  rentals,
  notifications,
  transactions,
  requests,
  libraries,
  onRefreshData,
  globalLibraryFilter = 'All',
  setGlobalLibraryFilter
}: ReaderDashboardProps) {
  // Navigation tabs inside reader mode
  const [activeTab, setActiveTab] = useState<'explore' | 'wishlist' | 'ledger' | 'wallet' | 'requests'>('explore');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLibraryFilter, setSelectedLibraryFilter] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('All');
  const [selectedRarity, setSelectedRarity] = useState<string>('All');
  const [selectedSort, setSelectedSort] = useState<string>('title');
  const [showAllBooks, setShowAllBooks] = useState<boolean>(false);

  // Keep internal selection synchronized with global Profile Bar selection
  useEffect(() => {
    if (globalLibraryFilter) {
      setSelectedLibraryFilter(globalLibraryFilter);
    }
  }, [globalLibraryFilter]);

  const handleLibraryFilterChange = (val: string) => {
    setSelectedLibraryFilter(val);
    if (setGlobalLibraryFilter) {
      setGlobalLibraryFilter(val);
    }
  };

  // Selected Book for details overlay
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [bookDetailsReviews, setBookDetailsReviews] = useState<Review[]>([]);
  const [activeDetailTab, setActiveDetailTab] = useState<'description' | 'reviews' | 'notes' | 'similar'>('description');
  
  // New review state
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewSpoiler, setNewReviewSpoiler] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  // New book request state
  const [reqTitle, setReqTitle] = useState('');
  const [reqAuthor, setReqAuthor] = useState('');
  const [reqGenre, setReqGenre] = useState('Novels');
  const [reqNote, setReqNote] = useState('');
  const [reqPriority, setReqPriority] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Rental Checkout Wizard Flow
  const [checkoutBook, setCheckoutBook] = useState<Book | null>(null);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('Anirudh P., TC 12/994, Palayam Junction, Near Central Library, Trivandrum - 695034');
  const [isProcessingRent, setIsProcessingRent] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Wallet Recharge Modal state
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Visa' | 'RuPay' | 'Netbanking'>('UPI');
  const [isProcessingRecharge, setIsProcessingRecharge] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [rechargeSuccessRef, setRechargeSuccessRef] = useState('');

  // Wishlist locally persisted state (book IDs)
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [wishlistAlerts, setWishlistAlerts] = useState<Record<string, boolean>>({});

  // Reader personal journal notes (locally saved for user notes tab)
  const [bookNotes, setBookNotes] = useState<Record<string, string>>({});

  // Gemini AI recommendation client state
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loadingAiRecs, setLoadingAiRecs] = useState(false);
  const [aiRecsMessage, setAiRecsMessage] = useState('');

  // Load local wishlist and notes on mount
  useEffect(() => {
    const savedWish = localStorage.getItem('lib_wishlist');
    if (savedWish) setWishlist(JSON.parse(savedWish));

    const savedAlerts = localStorage.getItem('lib_wishlist_alerts');
    if (savedAlerts) setWishlistAlerts(JSON.parse(savedAlerts));

    const savedNotes = localStorage.getItem('lib_book_notes');
    if (savedNotes) setBookNotes(JSON.parse(savedNotes));

    const handleGlobalTabChange = (e: Event) => {
      const customEvent = e as CustomEvent<any>;
      if (customEvent.detail) {
        setActiveTab(customEvent.detail);
      }
    };
    window.addEventListener('set-reader-tab', handleGlobalTabChange);
    return () => {
      window.removeEventListener('set-reader-tab', handleGlobalTabChange);
    };
  }, []);

  // Fetch book reviews when specific book selected
  useEffect(() => {
    if (selectedBook) {
      fetch(`/api/books/${selectedBook.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.reviews) setBookDetailsReviews(data.reviews);
        });
    }
  }, [selectedBook]);

  // Handle wishlist add/toggle
  const toggleWishlist = (bookId: string) => {
    let updated: string[];
    if (wishlist.includes(bookId)) {
      updated = wishlist.filter(id => id !== bookId);
    } else {
      updated = [...wishlist, bookId];
    }
    setWishlist(updated);
    localStorage.setItem('lib_wishlist', JSON.stringify(updated));
  };

  const toggleWishlistAlert = (bookId: string) => {
    const updated = {
      ...wishlistAlerts,
      [bookId]: !wishlistAlerts[bookId]
    };
    setWishlistAlerts(updated);
    localStorage.setItem('lib_wishlist_alerts', JSON.stringify(updated));
  };

  // Submit Rent Order
  const handleConfirmRent = async () => {
    if (!checkoutBook) return;
    setIsProcessingRent(true);
    setCheckoutError('');

    try {
      const response = await fetch('/api/rentals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: checkoutBook.id,
          deliveryAddress
        })
      });

      const data = await response.json();
      if (!response.ok) {
        setCheckoutError(data.error || 'Server error occurred');
      } else {
        // Success
        setCheckoutStep(5); // Scheduled
        // Auto progress to step 6 (Rented Activated) after 3.5 seconds
        setTimeout(() => {
          setCheckoutStep(6);
          onRefreshData();
        }, 3000);
      }
    } catch (err) {
      setCheckoutError('Connection failure.');
    } finally {
      setIsProcessingRent(false);
    }
  };

  // Submit Razorpay simulation
  const handlePerformRecharge = async () => {
    const amt = Number(rechargeAmount);
    if (isNaN(amt) || amt <= 0) return;
    setIsProcessingRecharge(true);

    try {
      const res = await fetch('/api/wallet/recharge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, method: paymentMethod })
      });
      const data = await res.json();
      if (res.ok) {
        setRechargeSuccessRef(data.transaction.referenceId);
        onRefreshData();
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
        }, 5000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingRecharge(false);
    }
  };

  // Retrieve AI Recommendations using Gemini server router
  const fetchSmartAiRecommendations = async () => {
    setLoadingAiRecs(true);
    setAiRecsMessage('');
    try {
      const res = await fetch('/api/ai/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          readingHistory: rentals.slice(0, 3).map(r => r.bookTitle || ''),
          preferredGenre: selectedGenre === 'All' ? 'Classic Malayalam Masterpieces' : selectedGenre
        })
      });
      const data = await res.json();
      if (data.recommendations) {
        setAiRecommendations(data.recommendations);
        if (data.isMocked) {
          setAiRecsMessage(data.providerMessage || 'Curated suggestions are loaded.');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAiRecs(false);
    }
  };

  // Submit new review
  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook || !newReviewComment.trim()) return;
    setSubmittingReview(true);

    try {
      const res = await fetch(`/api/books/${selectedBook.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newReviewRating,
          comment: newReviewComment,
          userName: user.name,
          spoilerTag: newReviewSpoiler
        })
      });
      if (res.ok) {
        setNewReviewComment('');
        setNewReviewSpoiler(false);
        // Refresh book reviews
        const reviewData = await res.json();
        setBookDetailsReviews(prev => [reviewData, ...prev]);
        onRefreshData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Submit suggesting book
  const handleSuggestBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqTitle || !reqAuthor) return;
    setSubmittingRequest(true);
    setRequestSuccess(false);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookTitle: reqTitle,
          author: reqAuthor,
          genre: reqGenre,
          personalNote: reqNote,
          priority: reqPriority
        })
      });
      if (res.ok) {
        setReqTitle('');
        setReqAuthor('');
        setReqNote('');
        setReqPriority(false);
        setRequestSuccess(true);
        onRefreshData();
        setTimeout(() => setRequestSuccess(false), 5000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Handle return courier dispatch simulator
  const handleDispatchReturn = async (rentId: string) => {
    try {
      const res = await fetch(`/api/rentals/${rentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Returned' })
      });
      if (res.ok) {
        onRefreshData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save specific book notes locally
  const handleSaveBookNote = (bookId: string, noteText: string) => {
    const updated = {
      ...bookNotes,
      [bookId]: noteText
    };
    setBookNotes(updated);
    localStorage.setItem('lib_book_notes', JSON.stringify(updated));
  };

  // Filter book list - with comprehensive multi-criteria categorization filters
  const filteredBooks = books.filter(b => {
    // 1. Library Filter
    const matchLibrary = selectedLibraryFilter === 'All' || b.libraryId === selectedLibraryFilter;
    
    // 2. Genre Category Filter
    const matchGenre = selectedGenre === 'All' || b.genre === selectedGenre;

    // 3. Language Filter
    let matchLanguage = true;
    if (selectedLanguage !== 'All') {
      const bookLang = (b.language || 'Malayalam').toLowerCase();
      if (selectedLanguage === 'Malayalam') {
        matchLanguage = bookLang.includes('malayalam');
      } else if (selectedLanguage === 'English') {
        matchLanguage = bookLang.includes('english');
      } else {
        // Translations or others
        matchLanguage = !bookLang.includes('malayalam') && !bookLang.includes('english');
      }
    }

    // 4. Availability Filter
    const matchAvailability = selectedAvailability === 'All' || 
      (selectedAvailability === 'Available' && b.availableCopies > 0);

    // 5. Rarity Filter
    const matchRarity = selectedRarity === 'All' ||
      (selectedRarity === 'Rare' && b.isRare === true);

    // 6. Search Bar query matching (Title, Author, Genre)
    const matchSearch = searchQuery.trim() === '' || 
      b.titleEnglish.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.titleMalayalam.includes(searchQuery) ||
      b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.genre.toLowerCase().includes(searchQuery.toLowerCase());

    return matchLibrary && matchGenre && matchLanguage && matchAvailability && matchRarity && matchSearch;
  }).sort((a, b) => {
    if (selectedSort === 'title') {
      return a.titleEnglish.localeCompare(b.titleEnglish);
    } else if (selectedSort === 'rating') {
      return b.rating - a.rating;
    } else if (selectedSort === 'priceAsc') {
      return a.rentalPrice - b.rentalPrice;
    } else if (selectedSort === 'priceDesc') {
      return b.rentalPrice - a.rentalPrice;
    } else if (selectedSort === 'copies') {
      return b.availableCopies - a.availableCopies;
    }
    return 0;
  });

  const categories = ['All', 'Novels', 'Poetry', 'Thriller', 'History', 'Biography', 'Drama', 'Spiritual', 'Political', 'Cinema', 'Science', 'Philosophy'];

  return (
    <div className="min-h-screen pb-16 bg-slate-50 text-slate-900 select-none">
      
      {/* Dynamic Fake Confetti for Razorpay Success */}
      {showConfetti && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute top-1/4 animate-bounce text-6xl">🎉 🪙 ✨ 📦 💖 🪙 🎉</div>
          <div className="absolute top-1/2 text-4xl transform rotate-12">📚 ₹₹₹ 📝</div>
        </div>
      )}

      {/* Hero Welcome Row / Header detail */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <span className="text-4xl p-2 bg-slate-50 border border-slate-100 rounded-xl">📖</span>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-serif text-slate-900 font-black text-xl">നമസ്കാരം, {user.name}</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono px-3 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  {user.membershipStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Your reading streak: <strong className="text-orange-600">🔥 {user.streak} Days active</strong></p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Wallet Tracker Pill */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              onClick={() => setActiveTab('wallet')}
              className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-2xl flex items-center space-x-3 shadow-md cursor-pointer transition-all hover:shadow-lg"
            >
              <Wallet className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <div className="text-[9px] uppercase font-mono tracking-wider text-slate-400 font-bold">My Purse Balance</div>
                <div className="text-sm font-mono font-black leading-none mt-0.5 text-indigo-300">₹{user.walletBalance}</div>
              </div>
            </motion.div>

            {/* In-App Info Alerts Icon */}
            <div className="relative group cursor-pointer" onClick={() => setActiveTab('ledger')}>
              <div className="bg-slate-100 p-3 rounded-2xl border border-slate-200 hover:bg-slate-200 transition-all relative">
                <Bell className="w-4 h-4 text-indigo-600" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-rose-500 border border-white"></span>
                )}
              </div>
              <div className="absolute right-0 top-13 bg-white border border-slate-200 shadow-xl rounded-2xl p-4 w-72 text-xs select-none pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <div className="font-bold border-b border-slate-100 pb-1.5 mb-1.5 text-slate-900">Recent Delivery Notifications</div>
                {notifications.slice(0, 2).map(n => (
                  <div key={n.id} className="py-1">
                    <div className="font-bold text-slate-800">{n.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-2">{n.message}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Sub Navigation Bar - Bento style navigation pill selector */}
        <div className="flex items-center overflow-x-auto space-x-1.5 border-b border-slate-200 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-sans font-extrabold tracking-wide flex items-center space-x-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'explore' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span> Explore Catalog (നിധിശാല)</span>
          </button>

          <button
            onClick={() => setActiveTab('wishlist')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-sans font-extrabold tracking-wide flex items-center space-x-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'wishlist' 
                ? 'bg-[#6E1F28] bg-slate-900 text-white shadow-sm' 
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200/60'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>My Wishlist ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-sans font-extrabold tracking-wide flex items-center space-x-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'ledger' 
                ? 'bg-emerald-650 bg-emerald-600 text-white shadow-sm' 
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reader Ledger &amp; Streaks</span>
          </button>

          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-sans font-extrabold tracking-wide flex items-center space-x-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'wallet' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200/60'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Purse &amp; Transactions</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-sans font-extrabold tracking-wide flex items-center space-x-2 transition-all flex-shrink-0 cursor-pointer ${
              activeTab === 'requests' 
                ? 'bg-indigo-900 text-white shadow-sm' 
                : 'text-slate-600 bg-slate-100 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Suggest Missing Book</span>
          </button>
        </div>

        {/* ----------------- EXPLORE VIEW ----------------- */}
        {activeTab === 'explore' && (
          <div>
            {/* Search Experience - Pure without filters */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs mb-6">
              <div className="relative">
                <label className="text-xs font-semibold text-gray-500 block mb-1">Search Literary Heritage Catalog</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search over thousands of books by Title (ബാല്യകാലസഖി), Author (Basheer), or keywords..."
                    className="w-full bg-slate-50 border border-slate-200 pl-10 pr-24 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  />
                  {searchQuery && (
                    <button onClick={()=>setSearchQuery('')} className="absolute right-3 top-3 text-xs text-slate-400 hover:text-black">Clear</button>
                  )}
                </div>
              </div>

              {/* Status Header for Location-wise search result matching */}
              {selectedLibraryFilter !== 'All' && (
                <div className="mt-4 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center space-x-2 text-indigo-900">
                    <span>📍</span>
                    <span>
                      Showing books specifically from <strong className="font-sans font-extrabold">{libraries.find(l=>l.id === selectedLibraryFilter)?.name || selectedLibraryFilter}</strong>
                    </span>
                  </div>
                  <button 
                    onClick={() => handleLibraryFilterChange('All')}
                    className="bg-white hover:bg-slate-100 text-slate-700 font-bold px-3 py-1 border border-slate-200 rounded-lg text-[10px] uppercase cursor-pointer transition-colors"
                  >
                    Show All Branches
                  </button>
                </div>
              )}
            </div>

            {/* Gemini Intelligence Prompting Module */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg border border-slate-800 mb-8 relative overflow-hidden bento-card-hover">
              <div className="absolute right-4 bottom-4 text-8xl opacity-10">✍️</div>
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-xl">
                  <div className="inline-flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Gemini AI Literary Advisor</span>
                  </div>
                  <h3 className="font-sans text-xl font-black text-white tracking-tight">Looking for a special Malayalam masterpiece?</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Based on your ledger patterns (such as reading <em className="text-indigo-400 font-bold font-mono">Myths or Biographies</em>), Gemini will construct a premium suggested selection of real-world Malayalam classics outside our immediate local seed.
                  </p>
                </div>
                <div>
                  <button
                    onClick={fetchSmartAiRecommendations}
                    disabled={loadingAiRecs}
                    className="px-5 py-3 bg-indigo-650 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow transition-all duration-180 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {loadingAiRecs ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>Get AI Recommendations</span>
                  </button>
                </div>
              </div>

              {/* AI Recommendations Panel */}
              {aiRecommendations.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-5 p-4 bg-white/5 rounded-2xl border border-white/10 text-xs text-slate-100"
                >
                  <h4 className="font-serif text-indigo-300 font-bold uppercase tracking-wider mb-3">Suggested Masterpieces:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {aiRecommendations.map((rec, idx) => (
                      <div key={idx} className="bg-black/25 p-3.5 rounded-xl border border-white/5">
                        <div className="italic text-indigo-300 text-xs mb-1 font-serif font-bold">{rec.reason}</div>
                        <div className="text-white font-bold flex items-center space-x-1">
                          <span>📍</span>
                          <span>{rec.suggestion}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 italic">{rec.blurb}</p>
                      </div>
                    ))}
                  </div>
                  {aiRecsMessage && (
                    <div className="text-[10px] text-slate-400 mt-2 text-right italic">{aiRecsMessage}</div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Featured Classics Carousel */}
            {searchQuery === '' && selectedGenre === 'All' && (
              <div className="mb-8">
                <h3 className="font-sans text-xl font-black text-slate-900 mb-4 flex items-center space-x-2">
                  <span>✨</span>
                  <span>Featured Malayalam Classics</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {books.slice(0, 3).map(book => (
                    <div 
                      key={book.id}
                      onClick={() => setSelectedBook(book)}
                      className="bg-white hover:bg-slate-100/40 p-5 rounded-3xl border border-slate-200 cursor-pointer flex gap-5 transition-all hover:shadow-md hover:-translate-y-0.5 bento-card-hover"
                    >
                      {/* Generative Gradient Background styled as hardcover */}
                      <div 
                        style={{ background: getBookCoverBackground(book.coverImage) }}
                        className="w-24 h-36 rounded-xl text-white p-2.5 flex flex-col justify-between shadow-md relative overflow-hidden flex-shrink-0"
                      >
                        <div className="text-[9px] font-mono tracking-widest text-indigo-400 border border-indigo-550/20 px-1 py-0.5 text-center bg-black/40 rounded">
                          LIB CLASSIC
                        </div>
                        <div className="text-center font-serif">
                          <h4 className="text-[12px] font-bold line-clamp-2 leading-tight">{book.titleMalayalam}</h4>
                          <h5 className="text-[9px] tracking-wider uppercase opacity-85 mt-0.5">{book.titleEnglish}</h5>
                        </div>
                        <div className="text-[8px] font-mono opacity-75">{book.author}</div>
                      </div>

                      <div className="flex flex-col justify-between py-1 flex-grow">
                        <div>
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] bg-indigo-50 text-indigo-600 font-extrabold uppercase font-sans px-2.5 py-1 rounded-full">
                              {book.genre}
                            </span>
                            {book.isRare && (
                              <span className="text-[9px] bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full uppercase font-bold">
                                rare
                              </span>
                            )}
                          </div>
                          <h4 className="font-serif font-bold text-md mt-1.5 text-slate-900">{book.titleEnglish} ({book.titleMalayalam})</h4>
                          <p className="text-[11px] text-slate-500">{book.author}</p>
                          <p className="text-[11px] text-slate-600 line-clamp-3 mt-1.5 leading-relaxed">{book.description}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs pt-2">
                          <div className="flex items-center text-amber-500">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span className="font-semibold text-xs ml-0.8 text-slate-700">{book.rating}</span>
                          </div>
                          <div>
                            {book.availableCopies > 0 ? (
                              <span className="text-emerald-700 font-bold text-[11px] flex items-center space-x-1">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                                <span>{book.availableCopies} Copies Available</span>
                              </span>
                            ) : (
                              <span className="text-rose-700 font-bold text-[11px] flex items-center space-x-1">
                                <span className="h-2 w-2 rounded-full bg-rose-400 inline-block"></span>
                                <span>No Copies Left</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Catalog Grid */}
            <div>
              {/* Comprehensive Advanced Filtration Dashboard Panel */}
              <div id="advanced-filtration-dashboard" className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs mb-6">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🎛️</span>
                    <h4 className="font-sans font-black text-slate-800 text-xs uppercase tracking-wider">Advanced Catalog Filtration System</h4>
                  </div>
                  <button 
                    id="btn-reset-all-filters"
                    onClick={() => {
                      setSelectedGenre('All');
                      setSelectedLanguage('All');
                      setSelectedAvailability('All');
                      setSelectedRarity('All');
                      setSelectedSort('title');
                      setShowAllBooks(false);
                    }}
                    className="text-[10px] uppercase font-bold text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Genre Category</label>
                    <select
                      id="filter-genre-select"
                      value={selectedGenre}
                      onChange={(e) => {
                        setSelectedGenre(e.target.value);
                        setShowAllBooks(false); // Reset see-all on filter change to stay elegant
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Language Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Language</label>
                    <select
                      id="filter-language-select"
                      value={selectedLanguage}
                      onChange={(e) => {
                        setSelectedLanguage(e.target.value);
                        setShowAllBooks(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="All">All Languages</option>
                      <option value="Malayalam">Malayalam Only</option>
                      <option value="English">English Only</option>
                      <option value="Translations">Translations / Others</option>
                    </select>
                  </div>

                  {/* Availability Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Availability</label>
                    <select
                      id="filter-availability-select"
                      value={selectedAvailability}
                      onChange={(e) => {
                        setSelectedAvailability(e.target.value);
                        setShowAllBooks(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="All">All Books</option>
                      <option value="Available">Available to Rent (In Stock)</option>
                    </select>
                  </div>

                  {/* Rarity Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Rarity / Collector</label>
                    <select
                      id="filter-rarity-select"
                      value={selectedRarity}
                      onChange={(e) => {
                        setSelectedRarity(e.target.value);
                        setShowAllBooks(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="All">All Curations</option>
                      <option value="Rare">Rare Collector Editions</option>
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sort Catalog By</label>
                    <select
                      id="filter-sort-select"
                      value={selectedSort}
                      onChange={(e) => {
                        setSelectedSort(e.target.value);
                        setShowAllBooks(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl p-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-800 font-medium cursor-pointer"
                    >
                      <option value="title">English Title (A-Z)</option>
                      <option value="rating">Expert Rating (High → Low)</option>
                      <option value="priceAsc">Rent Price (Low → High)</option>
                      <option value="priceDesc">Rent Price (High → Low)</option>
                      <option value="copies">Available Stock Vol</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-sans text-lg font-black text-slate-900">
                  {searchQuery ? `Search Results (${filteredBooks.length})` : 'All Book Publications'}
                </h3>
                <span className="text-xs text-slate-500 font-mono font-bold uppercase tracking-wider">
                  {showAllBooks ? `Showing all ${filteredBooks.length} titles` : `Showing ${Math.min(30, filteredBooks.length)} of ${filteredBooks.length} titles`} listed
                </span>
              </div>

              {filteredBooks.length === 0 ? (
                /* Malayalam Literary Empty State with Suggest CTA */
                <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm select-none my-8 max-w-xl mx-auto bento-card-hover">
                  <div className="text-5xl mb-4">🌾</div>
                  <h4 className="font-serif font-black text-lg text-rose-800 mb-1">
                    "ഈ പുസ്തകം ഇപ്പോൾ ലഭ്യമല്ല"
                  </h4>
                  <p className="text-sm text-slate-500 mb-6">
                    Unfortunately, this literary piece or keyword matches nothing in our local seed assets database. No worries! Our library partners can source it.
                  </p>
                  <button
                    onClick={() => {
                      setReqTitle(searchQuery);
                      setActiveTab('requests');
                    }}
                    className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl tracking-wider transition-colors cursor-pointer inline-flex items-center space-x-1.5 shadow-sm"
                  >
                    <span>Suggest/Request This Title</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <React.Fragment>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {filteredBooks.slice(0, showAllBooks ? filteredBooks.length : 30).map(book => {
                      const isBookWishlisted = wishlist.includes(book.id);
                      return (
                      <div 
                        key={book.id}
                        className="bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all bento-card-hover group flex flex-col justify-between"
                      >
                        {/* Book image Cover visual */}
                        <div 
                          style={{ background: getBookCoverBackground(book.coverImage) }}
                          onClick={() => setSelectedBook(book)}
                          className="h-44 flex flex-col items-center justify-center text-white p-4 text-center cursor-pointer relative overflow-hidden group-hover:scale-102 transition-transform duration-200"
                        >
                          {/* Wishlist quick toggle button overlay */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(book.id);
                            }}
                            className="absolute top-2.5 right-2.5 bg-black/60 p-1.5 rounded-full text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          >
                            <Heart className={`w-3.5 h-3.5 ${isBookWishlisted ? 'fill-[#E91E63] text-[#E91E63]' : ''}`} />
                          </button>

                          <div className="font-serif max-w-[90%] pointer-events-none">
                            <h4 className="font-bold text-sm leading-tight line-clamp-2 drop-shadow-md">{book.titleMalayalam}</h4>
                            <p className="text-[10px] tracking-wider uppercase opacity-80 mt-1 drop-shadow-sm">{book.titleEnglish}</p>
                          </div>
                          
                          <div className="absolute bottom-2 text-[9px] font-mono text-indigo-300 drop-shadow-sm pointer-events-none">
                            {book.author}
                          </div>
                        </div>

                        {/* Text and Rent Buttons */}
                        <div className="p-3.5 flex-grow flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">
                                {book.genre}
                              </span>
                              <div className="flex items-center text-amber-500 text-[10px]">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="font-bold ml-0.5 text-slate-700">{book.rating}</span>
                              </div>
                            </div>
                            <h4 
                              onClick={() => setSelectedBook(book)}
                              className="font-serif font-bold text-xs mt-2 text-slate-900 group-hover:text-indigo-650 transition-colors cursor-pointer line-clamp-1"
                            >
                              {book.titleEnglish}
                            </h4>
                            <p className="text-[10px] text-slate-500">{book.author}</p>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                            <span className="text-xs font-mono font-bold text-indigo-600">
                              ₹{book.rentalPrice}<span className="text-[9px] text-slate-400 font-normal">/20d</span>
                            </span>
                            
                            {book.availableCopies > 0 ? (
                              <button
                                onClick={() => {
                                  setCheckoutBook(book);
                                  setCheckoutStep(1);
                                }}
                                className="px-3 py-1.5 bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg cursor-pointer flex items-center space-x-1"
                              >
                                <span>Rent Now</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setSelectedBook(book)} // Opens notify me toggle inside details
                                className="px-2 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-600 text-[10px] font-bold rounded-lg cursor-pointer"
                              >
                                Notify me
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
                {!showAllBooks && filteredBooks.length > 30 && (
                  <div className="mt-8 flex justify-center">
                    <button
                      id="see-all-books-btn"
                      onClick={() => setShowAllBooks(true)}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase rounded-xl tracking-wider transition-all duration-200 shadow-md hover:scale-[1.02] flex items-center space-x-2 cursor-pointer"
                    >
                      <span>See All {filteredBooks.length} Books</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
                </React.Fragment>
              )}
            </div>
          </div>
        )}

        {/* ----------------- WISHLIST VIEW ----------------- */}
        {activeTab === 'wishlist' && (
          <div>
            <div className="bg-white rounded-3xl border border-slate-200 p-6 mb-6 bento-card-hover">
              <h3 className="font-sans text-xl font-black text-slate-900 flex items-center space-x-2">
                <span>📚</span>
                <span>My Wishlist Bookmarks</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Save classics to read next, get instant SMS alerts when out-of-stock items return to multi-tenant shelves, and manage easy quick checkout paths.
              </p>
            </div>

            {wishlist.length === 0 ? (
              <div className="bg-white p-16 text-center rounded-3xl border border-slate-200 max-w-md mx-auto my-8 bento-card-hover">
                {/* Visual Malayalam Book Shelf empty indicator */}
                <div className="text-6xl mb-4">🛖</div>
                <h4 className="font-serif font-bold text-md text-slate-900">
                  നിങ്ങളുടെ ഇഷ്ട പുസ്തകങ്ങൾ ഇവിടെ പ്രത്യക്ഷപ്പെടും
                </h4>
                <p className="text-xs text-slate-500 mt-2 max-w-xs mx-auto">
                  Your bookmarked books are currently empty. Explore the literary treasures catalog and click on the heart icon.
                </p>
                <button
                  onClick={() => setActiveTab('explore')}
                  className="mt-6 px-4 py-2 bg-indigo-650 text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-indigo-700 shadow-sm"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlist.map(bookId => {
                  const book = books.find(b => b.id === bookId);
                  if (!book) return null;
                  const notifyEnabled = wishlistAlerts[book.id] || false;
                  return (
                    <div 
                      key={book.id}
                      className="bg-white rounded-3xl border border-slate-200 p-5 flex gap-4 items-center justify-between hover:shadow-md transition-all bento-card-hover"
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          style={{ background: getBookCoverBackground(book.coverImage) }}
                          className="w-12 h-18 rounded-lg flex items-center justify-center text-white text-[10px] font-serif text-center font-bold relative overflow-hidden"
                        >
                          {book.titleMalayalam.substring(0,3)}
                        </div>
                        <div>
                          <h4 className="font-serif font-bold text-sm text-slate-900">{book.titleEnglish} ({book.titleMalayalam})</h4>
                          <h5 className="text-xs text-slate-400 font-mono">{book.author} &bull; {book.genre}</h5>
                          
                          {/* Stock status indicator */}
                          <div className="flex items-center space-x-2 mt-1.5">
                            {book.availableCopies > 0 ? (
                              <span className="text-xs text-emerald-700 font-bold flex items-center space-x-1">
                                <span className="h-1.5 w-1.5 rounded bg-emerald-500"></span>
                                <span>{book.availableCopies} available</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-bold flex items-center space-x-1">
                                <span className="h-1.5 w-1.5 rounded bg-slate-400 animate-pulse"></span>
                                <span>Out of stock</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Wishlist smart interactive toggles & rent CTA */}
                      <div className="flex flex-col items-end space-y-2">
                        {/* Notify SMS alert when restocked */}
                        {!book.availableCopies ? (
                          <label className="flex items-center space-x-1 text-[10px] font-bold text-indigo-600 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={notifyEnabled}
                              onChange={() => toggleWishlistAlert(book.id)}
                              className="accent-indigo-600"
                            />
                            <span>SMS Restock Alert</span>
                          </label>
                        ) : (
                          <button
                            onClick={() => {
                              setCheckoutBook(book);
                              setCheckoutStep(1);
                            }}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg cursor-pointer shadow-xs"
                          >
                            Quick Rent ₹10
                          </button>
                        )}

                        <button
                          onClick={() => toggleWishlist(book.id)}
                          className="text-xs text-red-600 hover:text-red-900 font-mono hover:underline cursor-pointer flex items-center space-x-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- HEALTHY READER LEDGER VIEW & STREAM TRACKING ----------------- */}
        {activeTab === 'ledger' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Ledger Info */}
            <div className="lg:col-span-8">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs mb-6 bento-card-hover">
                <h3 className="font-sans text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center space-x-2">
                  <span>📜</span>
                  <span>My Active Rentals Ledger</span>
                </h3>

                {rentals.filter(r => r.status !== 'Returned').length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No active rented books found on your profile cards. Browse some classics to rent via home delivery!</p>
                ) : (
                  <div className="space-y-4">
                    {rentals.filter(r => r.status !== 'Returned').map(rent => {
                      const overdue = rent.status === 'Overdue';
                      return (
                        <div key={rent.id} className="bg-slate-50 rounded-2xl border border-slate-200 p-5">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                            <div>
                              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full font-mono ${
                                overdue 
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                  : 'bg-indigo-50 text-indigo-650 border border-indigo-200'
                              }`}>
                                {rent.status}
                              </span>
                              <h4 className="font-serif font-bold text-sm text-slate-900 mt-2">
                                {rent.bookTitle} ({rent.bookTitleMalayalam})
                              </h4>
                              <p className="text-xs text-slate-500">Tracking Code: <strong className="font-mono text-slate-700">{rent.trackingCode}</strong></p>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-semibold text-slate-500 block">Due Date:</span>
                              <span className={`text-xs font-bold ${overdue ? 'text-rose-600 font-mono' : 'text-slate-700'}`}>
                                {new Date(rent.dueDate).toDateString()} {overdue && ' (EXPIRED)'}
                              </span>
                            </div>
                          </div>

                          {/* Courier Tracking timeline details */}
                          <div className="bg-white/80 p-3 rounded-lg border border-gray-100 flex items-center justify-between text-xs mb-3 font-mono">
                            <span className="text-gray-500">Status Timeline:</span>
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#3E5879]">
                              <span>🚚</span>
                              <span>{rent.status === 'Requested' ? 'Processing Dispatch' : rent.status === 'Dispatched' ? 'In Courier Vehicle' : 'Delivered on Hand'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-gray-200">
                            <div>
                              {overdue && (
                                <span className="text-xs text-red-600 font-serif font-bold flex items-center space-x-1 animate-pulse">
                                  <AlertTriangle className="w-4 h-4 text-red-600" />
                                  <span>Accumulated Late Fee: ₹{rent.lateFeeCharged} (₹1/day)</span>
                                </span>
                              )}
                              {!overdue && (
                                <span className="text-xs text-green-700 font-medium">✨ Delivery Included on pristine paper textures</span>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Open detail view to read journal notes or rate */}
                              <button
                                onClick={() => {
                                  const searchMatch = books.find(b => b.id === rent.bookId);
                                  if (searchMatch) setSelectedBook(searchMatch);
                                }}
                                className="px-3 py-1.5 bg-neutral-200 text-xs font-bold rounded-lg cursor-pointer"
                              >
                                Journal Notes / Rate
                              </button>

                              {/* Manual return simulation triggers stock refresh */}
                              <button
                                onClick={() => handleDispatchReturn(rent.id)}
                                className="px-3.5 py-1.5 bg-[#6E1F28] hover:bg-[#4d141a] text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                              >
                                Return via Courier
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Historical Ledger Card */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover mt-6">
                <h3 className="font-sans text-lg font-black text-slate-900 border-b border-slate-100 pb-3 mb-4">Past Readings Ledger Card</h3>
                {rentals.filter(r => r.status === 'Returned').length === 0 ? (
                  <p className="text-slate-500 text-xs italic">No books in return archives yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {rentals.filter(r => r.status === 'Returned').map(rent => (
                      <div key={rent.id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 py-0.5 px-2.5 rounded-full uppercase font-bold">
                            Returned Safe
                          </span>
                          <h4 className="font-serif font-bold text-xs text-slate-800 mt-1.5">{rent.bookTitle}</h4>
                          <p className="text-[10px] text-slate-400">Rented: {new Date(rent.rentedDate).toLocaleDateString()} &bull; Returned: {rent.returnedDate ? new Date(rent.returnedDate).toLocaleDateString() : ''}</p>
                        </div>
                        <span className="text-xs font-serif italic text-slate-500">Completed &bull; ₹10</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Reading Streaks Visual tracker */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Streaks Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden">
                <span className="text-2xl">🔥</span>
                <h3 className="font-sans text-lg font-black mt-2 text-white">Active Reading Streak</h3>
                <div className="text-4xl font-mono font-black my-1 text-indigo-400">{user.streak} Days</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Excellent! You are cataloged under standard daily library checkouts. Reading Malayalam keeps heritage vibrant. Complete reading reviews to increment!
                </p>
                <div className="mt-4 bg-black/30 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <span className="text-[10px] text-indigo-300 font-mono leading-none block mt-1.5 text-right font-bold">Progress block: Standard Level 4/10</span>
              </div>

              {/* Notification Timelines warn layout */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <h3 className="font-sans text-sm font-black text-slate-900 border-b border-slate-100 pb-2 mb-3">Notification Timelines Alert</h3>
                <div className="space-y-3.5">
                  <div className="flex gap-2.5 text-xs">
                    <span className="text-amber-600 font-bold">5 Days Left:</span>
                    <span className="text-slate-550 text-slate-500">Friendly reminder email generated.</span>
                  </div>
                  <div className="flex gap-2.5 text-xs">
                    <span className="text-amber-700 font-bold">2 Days Left:</span>
                    <span className="text-slate-550 text-slate-500">SMS notification &quot;Return Soon&quot; queued.</span>
                  </div>
                  <div className="flex gap-2.5 text-xs">
                    <span className="text-rose-500 font-bold">Due Today:</span>
                    <span className="text-slate-600 font-medium font-semibold">Urgent courier pickup schedule alert.</span>
                  </div>
                  <div className="flex gap-2.5 text-xs">
                    <span className="text-rose-700 font-bold">Overdue:</span>
                    <span className="text-indigo-600 font-bold">₹1/day fee begins logging on transactions.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------- PURSE & TRANSACTIONS ----------------- */}
        {activeTab === 'wallet' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Wallet Info Column */}
            <div className="md:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between bento-card-hover">
              <div>
                <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-100 mb-4">
                  <div className="p-2.5 bg-indigo-55 bg-indigo-50 text-indigo-650 rounded-xl">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-md text-slate-900">My Digital Purse</h3>
                    <p className="text-[11px] text-slate-500">Secured through simulated Razorpay integrations</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-center my-4">
                  <div className="text-xs uppercase font-mono tracking-widest text-indigo-650 font-bold mb-1 text-indigo-600">Available balance</div>
                  <span className="text-3xl font-mono font-black text-slate-900">₹{user.walletBalance}</span>
                  <p className="text-[10px] text-slate-500 mt-2">Zero hidden dues. Deductions occur only upon rent validation.</p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRechargeOpen(true)}
                className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold font-sans text-sm shadow cursor-pointer transition-colors"
              >
                Recharge Purse via Razorpay
              </motion.button>
            </div>

            {/* Transactions Log List */}
            <div className="md:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
              <h3 className="font-sans text-md font-black text-slate-900 border-b border-slate-100 pb-3 mb-4">Purse Ledger Transactions History</h3>
              {transactions.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No transactions generated yet.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <div key={tx.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono font-semibold px-2 py-0.5 rounded text-[10px] ${
                            tx.type === 'Recharge' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'
                          }`}>
                            {tx.type}
                          </span>
                          <span className="text-slate-400 font-mono">ID: {tx.referenceId}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>

                      <div className="text-right">
                        <span className={`font-mono font-bold text-sm ${
                          tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}₹{tx.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ----------------- BOOK SUGGESTION MODULE ----------------- */}
        {activeTab === 'requests' && (
          <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm bento-card-hover">
            <h3 className="font-sans text-xl font-black text-slate-900 mb-1">
              "ഈ പുസ്തകം ലഭ്യമല്ലേ?" Suggest Unavailable Books
            </h3>
            <p className="text-xs text-slate-500 mb-6 border-b border-slate-100 pb-3.5">
              If a specific Malayalam masterpiece or publishing edition index is not listed, let our administrators know! We verify and source missing inventory within 3 business days.
            </p>

            {requestSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-sans font-semibold">
                <strong>📝 suggestion Logged into Admin Dashboard Queue!</strong> We will trigger an inventory check and alert you when stock arrives on Kottayam or TVM shelves.
              </div>
            )}

            <form onSubmit={handleSuggestBookSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Book Title (Malayalam + English preferred)</label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  placeholder="e.g. Mayyazhippuzhayude Theerangalil (മയ്യഴിപ്പുഴയുടെ തീരങ്ങളിൽ)"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-600 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Author Name</label>
                  <input
                    type="text"
                    required
                    value={reqAuthor}
                    onChange={(e) => setReqAuthor(e.target.value)}
                    placeholder="e.g. M. Mukundan"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Genre</label>
                  <select
                    value={reqGenre}
                    onChange={(e) => setReqGenre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2.5 px-3 rounded-xl text-xs focus:outline-none text-slate-800"
                  >
                    <option value="Novels">Novels</option>
                    <option value="Poetry">Poetry</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Biography">Biography</option>
                    <option value="Drama">Drama</option>
                    <option value="Political">Political</option>
                    <option value="Science">Science</option>
                    <option value="Philosophy">Philosophy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Personal note to Library Partners</label>
                <textarea
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  rows={3}
                  placeholder="Tell our archives why you are requesting this work (academic research or personal nostalgic reading...)"
                  className="w-full bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-xs focus:outline-none text-slate-800"
                ></textarea>
              </div>

              <div className="bg-indigo-50/55 rounded-2xl p-4 border border-indigo-100">
                <label className="flex items-center space-x-2.5 text-xs text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqPriority}
                    onChange={(e) => setReqPriority(e.target.checked)}
                    className="accent-indigo-600 h-4 w-4"
                  />
                  <span>
                    <strong>Priority Sourcing:</strong> I am willing to spend ₹10 booking cost instantly from user wallet once verified.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={submittingRequest}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-sans font-bold rounded-xl shadow cursor-pointer disabled:opacity-50"
              >
                {submittingRequest ? 'Logging to Partner queue...' : 'Submit Suggestion Sourced Request'}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-gray-100">
              <h4 className="font-serif text-[#1C1B1F] font-bold text-sm mb-2.5">Your Sourcing Log statuses:</h4>
              {requests.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No previous requests suggested.</p>
              ) : (
                <div className="space-y-2.5">
                  {requests.map(r => (
                    <div key={r.id} className="bg-neutral-50 p-2.5 rounded-lg text-xs flex justify-between items-center text-gray-500">
                      <div>
                        <strong className="text-gray-800">{r.bookTitle}</strong> &mdash; {r.author}
                      </div>
                      <span className={`px-2 py-0.5 rounded uppercase font-mono text-[9px] ${
                        r.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* =================== INDIVIDUAL BOOK DETAILS OVERLAY (BOTTOM SHEET / RIGHT PANE MODAL) =================== */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 bg-black/60 z-50 flex justify-end">
            
            {/* Click outside exits details */}
            <div className="flex-grow cursor-pointer" onClick={() => setSelectedBook(null)}></div>

            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-full max-w-xl bg-[#F8F4EE] min-h-screen px-6 py-6 overflow-y-auto shadow-2xl border-l border-[#C8A96B]/30 flex flex-col justify-between"
            >
              <div>
                {/* Book Details header split */}
                <div className="flex items-center justify-between mb-4 border-b border-[#E9E1D4] pb-3">
                  <span className="font-serif text-[#6E1F28] font-bold text-sm">ഗ്രന്ഥവിവരം &bull; Catalog details</span>
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="p-1.5 hover:bg-[#E9E1D4] rounded-lg text-[#1C1B1F] cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Primary Card View */}
                <div className="flex flex-col sm:flex-row gap-5 mb-5 items-start">
                  
                  {/* Hardcover Hard visual */}
                  <div 
                    style={{ background: getBookCoverBackground(selectedBook.coverImage) }}
                    className="w-36 h-52 items-center text-center justify-center p-4 text-white flex flex-col justify-between rounded-xl shadow-lg relative overflow-hidden flex-shrink-0 mx-auto sm:mx-0"
                  >
                    <span className="text-[10px] font-mono tracking-wider text-[#C8A96B] drop-shadow">KERALA COLLECTION</span>
                    <div className="font-serif drop-shadow-md">
                      <h3 className="font-bold text-sm leading-tight">{selectedBook.titleMalayalam}</h3>
                      <p className="text-[10px] opacity-80 mt-1 uppercase leading-none">{selectedBook.titleEnglish}</p>
                    </div>
                    <span className="text-[9px] font-mono text-gray-300 drop-shadow">{selectedBook.author}</span>
                  </div>

                  <div className="flex-grow text-center sm:text-left">
                    <span className="text-xs text-[#3E5879] bg-[#3E5879]/10 font-bold px-2 py-0.5 rounded-full inline-block mb-1.5">
                      {selectedBook.genre}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-[#1C1B1F] leading-tight">
                      {selectedBook.titleEnglish}
                    </h3>
                    <h4 className="font-serif text-xl font-bold text-[#6E1F28] mt-0.5">
                      {selectedBook.titleMalayalam}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">Author / ശില്പി: <strong>{selectedBook.author}</strong></p>
                    
                    <div className="flex items-center justify-center sm:justify-start space-x-1.5 text-xs text-amber-500 mt-2 font-mono">
                      <div className="flex">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.floor(selectedBook.rating) ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <span className="font-bold text-gray-700 ml-1">{selectedBook.rating} ({selectedBook.reviewsCount} reviews)</span>
                    </div>

                    {/* Rent Rate indicator details page */}
                    <div className="bg-white rounded-xl p-3.5 border border-[#E9E1D4] shadow-xs mt-4">
                      <table className="w-full text-xs text-left">
                        <tbody>
                          <tr className="border-b border-gray-100">
                            <td className="py-1 text-gray-500">Rental Price</td>
                            <td className="py-1 font-bold text-[#6E1F28] text-right">₹10</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1 text-gray-500">Rental Duration</td>
                            <td className="py-1 font-bold text-right text-[#3E5879]">20 Days</td>
                          </tr>
                          <tr className="border-b border-gray-100">
                            <td className="py-1 text-gray-500">Late Fee</td>
                            <td className="py-1 font-mono text-right text-red-500">₹1/day after 20d</td>
                          </tr>
                          <tr>
                            <td className="py-1 text-gray-500">Delivery Postage</td>
                            <td className="py-1 text-green-700 font-bold text-right">Included free</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                  </div>
                </div>

                {/* Adaptive segment tabs selectors */}
                <div className="flex border-b border-[#E9E1D4] text-xs mb-4">
                  <button
                    onClick={()=>setActiveDetailTab('description')}
                    className={`pb-2.5 px-3 font-bold cursor-pointer ${activeDetailTab === 'description' ? 'border-b-2 border-[#6E1F28] text-[#6E1F28]' : 'text-gray-500'}`}
                  >
                    Description
                  </button>
                  <button
                    onClick={()=>setActiveDetailTab('reviews')}
                    className={`pb-2.5 px-3 font-bold cursor-pointer relative ${activeDetailTab === 'reviews' ? 'border-b-2 border-[#6E1F28] text-[#6E1F28]' : 'text-gray-500'}`}
                  >
                    Reviews ({bookDetailsReviews.length})
                  </button>
                  <button
                    onClick={()=>setActiveDetailTab('notes')}
                    className={`pb-2.5 px-3 font-bold cursor-pointer ${activeDetailTab === 'notes' ? 'border-b-2 border-[#6E1F28] text-[#6E1F28]' : 'text-gray-500'}`}
                  >
                    My Reading Notes
                  </button>
                  <button
                    onClick={()=>setActiveDetailTab('similar')}
                    className={`pb-2.5 px-3 font-bold cursor-pointer ${activeDetailTab === 'similar' ? 'border-b-2 border-[#6E1F28] text-[#6E1F28]' : 'text-gray-500'}`}
                  >
                    Catalog Shelving
                  </button>
                </div>

                {/* Tab 1: Description with Malayalam translate */}
                {activeDetailTab === 'description' && (
                  <div className="text-xs space-y-3.5 leading-relaxed text-[#1C1B1F]/90">
                    <p className="font-medium text-gray-800">{selectedBook.description}</p>
                    {selectedBook.descriptionMalayalam && (
                      <div className="bg-[#E9E1D4]/40 p-3.5 rounded-lg border-l-4 border-[#C8A96B] font-serif tracking-wide text-[13px] italic">
                        {selectedBook.descriptionMalayalam}
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: Reviews interface (Verified rental indicator, star options, spoiler tags) */}
                {activeDetailTab === 'reviews' && (
                  <div className="space-y-4">
                    
                    {/* Write new review form */}
                    <form onSubmit={handlePostReview} className="bg-white p-3.5 rounded-xl border border-[#E9E1D4] text-xs space-y-2.5">
                      <div className="font-bold text-[#6E1F28]">Post Reader rating review:</div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] text-gray-500">Rating level:</span>
                        <div className="flex text-amber-500 space-x-1">
                          {[1,2,3,4,5].map(st => (
                            <button
                              type="button"
                              key={st}
                              onClick={()=>setNewReviewRating(st)}
                              className="focus:outline-none"
                            >
                              <Star className={`w-4 h-4 ${st <= newReviewRating ? 'fill-current' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        required
                        value={newReviewComment}
                        onChange={(e)=>setNewReviewComment(e.target.value)}
                        placeholder="കമന്റ് ഇവിടെ മലയാളം ലിപിയിലോ ഇംഗ്ലീഷിലോ എഴുതാം (Write comments in Malayalam or Transliteration...)"
                        rows={2}
                        className="w-full bg-[#F8F4EE] rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-[#3E5879] text-xs"
                      ></textarea>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center space-x-1.5 cursor-pointer text-[10px]">
                          <input
                            type="checkbox"
                            checked={newReviewSpoiler}
                            onChange={(e)=>setNewReviewSpoiler(e.target.checked)}
                            className="accent-red-600"
                          />
                          <span className="text-gray-500">Contains Plot Spoilers</span>
                        </label>

                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-3.5 py-1.5 bg-[#3E5879] hover:bg-[#2c3f59] text-white font-bold rounded-lg cursor-pointer"
                        >
                          {submittingReview ? 'Submitting...' : 'Post Review'}
                        </button>
                      </div>
                    </form>

                    {/* Reviews feed */}
                    {bookDetailsReviews.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">No reviews written for this classic yet.</p>
                    ) : (
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {bookDetailsReviews.map(rev => (
                          <div key={rev.id} className="bg-white p-3 rounded-xl border border-gray-100 text-xs text-gray-900">
                            <div className="flex items-center justify-between space-x-2 mb-1.5">
                              <span className="font-bold text-gray-800">{rev.userName}</span>
                              <div className="flex text-amber-500">
                                {[1,2,3,4,5].map(str => (
                                  <Star key={str} className={`w-3 h-3 ${str <= rev.rating ? 'fill-current' : 'text-grey-200'}`} />
                                ))}
                              </div>
                            </div>
                            
                            {rev.isVerifiedRental && (
                              <span className="text-[9px] text-green-700 font-bold bg-green-50 px-1 rounded inline-block mb-1">
                                &bull; Verified Reader Rental
                              </span>
                            )}

                            {rev.spoilerTag ? (
                              <p className="text-[11px] text-red-800 bg-red-50/50 p-2 rounded border border-red-100 italic">
                                [Warning: Plot spoilers hidden in review logs]
                              </p>
                            ) : (
                              <p className="text-[11.5px] italic text-[#1C1B1F]">{rev.comment}</p>
                            )}

                            {rev.replyMessage && (
                              <div className="mt-2 pl-3 border-l-2 border-[#C8A96B] text-[10.5px] text-gray-500 italic bg-[#F8F4EE] p-2 rounded">
                                <strong>Reply from Library:</strong> {rev.replyMessage}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                )}

                {/* Tab 3: Reader private journal notes */}
                {activeDetailTab === 'notes' && (
                  <div className="space-y-3">
                    <div className="bg-[#E9E1D4]/40 p-3 rounded-lg text-[11px] text-[#6E1F28] font-bold">
                      📝 Your Private Reading Log &amp; Study notes (saved locally):
                    </div>
                    <textarea
                      value={bookNotes[selectedBook.id] || ''}
                      onChange={(e) => handleSaveBookNote(selectedBook.id, e.target.value)}
                      placeholder="Jot down notes, interesting phrases, vocabulary index, or book quotes. Your notes are saved dynamically to sandbox browser storage."
                      rows={5}
                      className="w-full bg-white border border-[#E9E1D4] rounded-xl p-3.5 text-xs focus:ring-1 focus:ring-[#6E1F28]"
                    ></textarea>
                    <p className="text-[10px] text-gray-400 font-mono text-right">Draft is live updating</p>
                  </div>
                )}

                {/* Tab 4: Shelf details */}
                {activeDetailTab === 'similar' && (
                  <div className="space-y-3 text-xs">
                    <div className="bg-white p-3 rounded-xl border border-gray-100">
                      <div className="font-bold text-gray-800">Physical Sourcing Location:</div>
                      <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px]">
                        <div>Shelf Rack:</div>
                        <strong className="font-mono">{selectedBook.shelfLocation || 'A-01'}</strong>
                        <div>Publication Index:</div>
                        <strong className="text-gray-700">{selectedBook.publicationDetails || 'Seeded Library'}</strong>
                        <div>Managing Partner ID:</div>
                        <strong className="font-mono text-[#6E1F28] uppercase">{selectedBook.libraryId}</strong>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Detail Page footer actions */}
              <div className="pt-4 border-t border-[#E9E1D4] flex items-center justify-between gap-3 bg-[#F8F4EE]">
                <div>
                  <span className="text-xs text-gray-400 block font-mono">20-day delivery lease</span>
                  <span className="text-lg font-mono font-bold text-[#6E1F28]">₹10.00</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => toggleWishlist(selectedBook.id)}
                    className="p-3 bg-[#E9E1D4] hover:bg-[#c8bba6] rounded-xl text-neutral-800 cursor-pointer"
                  >
                    <Heart className={`w-4 h-4 ${wishlist.includes(selectedBook.id) ? 'fill-[#E91E63] text-[#E91E63]' : ''}`} />
                  </button>

                  {selectedBook.availableCopies > 0 ? (
                    <button
                      onClick={() => {
                        setCheckoutBook(selectedBook);
                        setSelectedBook(null); // Exits overlay to open checkout
                        setCheckoutStep(1);
                      }}
                      className="px-6 py-3 bg-[#3E5879] hover:bg-[#2c3f59] text-white font-serif font-bold text-xs rounded-xl shadow cursor-pointer uppercase tracking-wider"
                    >
                      Process Delivery Checkout
                    </button>
                  ) : (
                    <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 text-[10.5px] text-amber-800 font-semibold max-w-xs text-right">
                      ⚠️ No physical copies are currently shelving. Toggle <strong>SMS Restock Alert</strong> in Wishlist to request instantly.
                    </div>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================== COURIER CHECKOUT WIZARD FLOW DIALOG =================== */}
      <AnimatePresence>
        {checkoutBook && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-[#E9E1D4]"
            >
              <div className="bg-[#1C1B1F] p-4 text-white flex justify-between items-center text-xs">
                <span className="font-serif text-[#C8A96B] font-bold">Courier Delivery checkout wizard</span>
                <button onClick={() => setCheckoutBook(null)} className="text-gray-400 hover:text-white">✕ Close</button>
              </div>

              {/* Progress visual steps */}
              <div className="bg-neutral-50 px-4 py-3 border-b flex items-center justify-between text-[10px] font-mono font-bold text-gray-500">
                <span className={checkoutStep >= 1 ? 'text-[#3E5879]' : ''}>1. Confirm</span>
                <span>⟶</span>
                <span className={checkoutStep >= 2 ? 'text-[#3E5879]' : ''}>2. Address</span>
                <span>⟶</span>
                <span className={checkoutStep >= 3 ? 'text-[#3E5879]' : ''}>3. Funds</span>
                <span>⟶</span>
                <span className={checkoutStep >= 4 ? 'text-[#3E5879]' : ''}>4. Dispatch</span>
              </div>

              <div className="p-5">
                
                {/* Error Banner */}
                {checkoutError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold">
                    ⚠️ {checkoutError}
                  </div>
                )}

                {/* STEP 1: Select Book confirm details */}
                {checkoutStep === 1 && (
                  <div>
                    <h3 className="font-serif text-md font-bold mb-3">Does your order card match correctly?</h3>
                    <div className="bg-neutral-50 p-3 rounded-xl border flex items-center space-x-3 text-xs mb-5">
                      <div style={{ background: getBookCoverBackground(checkoutBook.coverImage) }} className="h-16 w-11 rounded-md text-white flex-shrink-0 text-center text-[8px] font-serif flex items-center justify-center">
                        {(!checkoutBook.coverImage || (!checkoutBook.coverImage.startsWith('http') && !checkoutBook.coverImage.startsWith('data:image'))) && "Grad"}
                      </div>
                      <div>
                        <strong className="text-gray-800">{checkoutBook.titleEnglish}</strong>
                        <div className="text-gray-400">{checkoutBook.author}</div>
                        <div className="font-mono text-[#6E1F28] font-bold mt-1">₹10.00 / 20 Days</div>
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStep(2)}
                      className="w-full py-2.5 bg-[#3E5879] hover:bg-[#2c3f59] text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Proceed to Doorstep Delivery Address ⟶
                    </button>
                  </div>
                )}

                {/* STEP 2: Address Confirmation */}
                {checkoutStep === 2 && (
                  <div>
                    <h3 className="font-serif text-md font-bold mb-1">Confirm Shipping Address</h3>
                    <p className="text-[11px] text-gray-500 mb-3">Postage delivery is fully integrated via our Local courier hub.</p>
                    
                    <textarea
                      required
                      value={deliveryAddress}
                      onChange={(e)=>setDeliveryAddress(e.target.value)}
                      rows={3}
                      className="w-full bg-[#F8F4EE] border rounded-xl p-3.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#3E5879] mb-4"
                    ></textarea>

                    <div className="flex space-x-2">
                      <button onClick={()=>setCheckoutStep(1)} className="px-3.5 py-2.5 bg-neutral-200 text-xs font-bold rounded-xl">Back</button>
                      <button
                        onClick={() => {
                          setCheckoutStep(3);
                          setCheckoutError('');
                        }}
                        className="flex-grow py-2.5 bg-[#3E5879] hover:bg-[#2c3f59] text-white text-xs font-bold rounded-xl"
                      >
                        Confirm Local Address
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Wallet balance check */}
                {checkoutStep === 3 && (
                  <div>
                    <h3 className="font-serif text-md font-bold mb-3">Rent Ledger Verification</h3>
                    
                    <div className="bg-neutral-50 rounded-xl p-4 border space-y-2 mb-5 text-xs">
                      <div className="flex justify-between">
                        <span>Purse Balance:</span>
                        <strong className="font-mono">₹{user.walletBalance}</strong>
                      </div>
                      <div className="flex justify-between border-t pt-1 text-[#6E1F28]">
                        <span>Required Rental Deduct:</span>
                        <strong className="font-mono">-₹10</strong>
                      </div>
                      <div className="flex justify-between border-t pt-1 font-bold">
                        <span>Balance after Deduct:</span>
                        <span className="font-mono text-green-700">₹{user.walletBalance - 10}</span>
                      </div>
                    </div>

                    {user.walletBalance < 10 ? (
                      <div className="text-xs text-red-600 bg-red-50 p-3 rounded-lg flex flex-col items-center mb-4">
                        <span>Wallet Balance insufficient (Purse balance ₹{user.walletBalance}). Please recharge first.</span>
                        <button
                          onClick={() => {
                            setCheckoutBook(null); // Exits checkout
                            setActiveTab('wallet');
                            setRechargeOpen(true);
                          }}
                          className="mt-2.5 px-3 py-1.5 bg-[#6E1F28] text-white rounded font-bold"
                        >
                          Recharge via Razorpay Interface
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button onClick={()=>setCheckoutStep(2)} className="px-3.5 py-2.5 bg-neutral-200 text-xs font-bold rounded-xl">Back</button>
                        <button
                          onClick={handleConfirmRent}
                          disabled={isProcessingRent}
                          className="flex-grow py-2.5 bg-[#6E1F28] hover:bg-[#4d141a] text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2"
                        >
                          {isProcessingRent ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>Verify Ledger &amp; Rent now</span>
                              <CheckCircle2 className="w-4 h-4 text-[#C8A96B]" />
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4: Courier scheduling pipeline simulating status */}
                {checkoutStep === 5 && (
                  <div className="text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-[#3E5879]/10 text-[#3E5879] flex items-center justify-center mx-auto mb-3 animate-pulse">
                      🚚
                    </div>
                    <h3 className="font-serif text-md font-bold text-gray-800">Assigning Courier Partner...</h3>
                    <p className="text-xs text-gray-500 mt-2">
                      Securing delivery dispatch logs under modern Malayalam distribution tracking records. Please hold.
                    </p>
                    <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-4">
                      <div className="bg-[#3E5879] h-1.5 rounded-full animate-infinite-loading"></div>
                    </div>
                  </div>
                )}

                {/* STEP 5: Delivery activated success summary */}
                {checkoutStep === 6 && (
                  <div className="text-center p-4 space-y-3">
                    <span className="text-5xl block animate-bounce">📦</span>
                    <h3 className="font-serif text-lg font-bold text-green-700">Rental successfully Activated!</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      ₹10 deducted from purse. The library partner has been notified to hand over <strong>"{checkoutBook.titleEnglish}"</strong> to our courier team who will deliver to your doorstep!
                    </p>
                    
                    <button
                      onClick={() => {
                        setCheckoutBook(null);
                        setActiveTab('ledger');
                      }}
                      className="w-full mt-4 py-2 bg-[#1C1B1F] hover:bg-neutral-800 text-white text-xs font-bold rounded-xl"
                    >
                      Track Shipment inside Reader Ledger
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =================== RAZORPAY SIMULATED GATEWAY OVERLAY =================== */}
      <AnimatePresence>
        {rechargeOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <motion.div 
              style={{ borderTop: '4px solid #002e6e' }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              {/* Razorpay Authentic Headline */}
              <div className="bg-[#002e6e] p-4 text-white flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">💳</span>
                  <span className="font-mono font-black tracking-tighter">Razorpay <span className="opacity-75 font-normal text-[9px] border px-1 rounded uppercase">SIMULATOR</span></span>
                </div>
                <button onClick={() => setRechargeOpen(false)} className="text-white hover:opacity-50">✕ Close</button>
              </div>

              <div className="p-5">
                
                {rechargeSuccessRef ? (
                  <div className="text-center space-y-3.5 py-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto text-xl">✓</div>
                    <h3 className="font-bold text-md text-gray-900">Purse recharge approved!</h3>
                    <div className="bg-[#F8F4EE] p-3 rounded-lg text-xs font-mono border">
                      <div className="text-gray-400">Reference ID:</div>
                      <div className="font-semibold">{rechargeSuccessRef}</div>
                    </div>
                    <button
                      onClick={() => {
                        setRechargeSuccessRef('');
                        setRechargeOpen(false);
                      }}
                      className="px-5 py-2 bg-[#002e6e] text-white text-xs font-semibold rounded"
                    >
                      Back to purse
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider block mb-1">Enter Deposit amount (INR)</label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2 text-md font-bold">₹</span>
                        <input
                          type="number"
                          value={rechargeAmount}
                          onChange={(e)=>setRechargeAmount(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-2 pl-7 text-sm font-mono font-bold text-gray-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5">Select Simulated Gateway Mode</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['UPI', 'Visa', 'RuPay', 'Netbanking'] as const).map(mode => (
                          <button
                            type="button"
                            key={mode}
                            onClick={()=>setPaymentMethod(mode)}
                            className={`p-2.5 rounded-xl text-left border text-xs font-semibold uppercase flex items-center space-x-1.5 transition-colors cursor-pointer ${
                              paymentMethod === mode 
                                ? 'bg-[#002e6e] text-white border-transparent shadow' 
                                : 'bg-white text-gray-700 border-neutral-200 hover:bg-neutral-50'
                            }`}
                          >
                            <span>💳</span>
                            <span>{mode}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handlePerformRecharge}
                      disabled={isProcessingRecharge}
                      className="w-full mt-4 py-3 bg-[#002e6e] hover:bg-[#00204d] text-white font-mono font-bold rounded-lg shadow cursor-pointer text-xs uppercase flex items-center justify-center space-x-2"
                    >
                      {isProcessingRecharge ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Pay via Razorpay SIM</span>
                          <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded font-mono">₹{rechargeAmount}</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
