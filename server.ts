/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { SEEDED_BOOKS, SEEDED_LIBRARIES, SEEDED_REVIEWS } from './src/data/seedData';
import { Book, Rental, Review, BookRequest, WalletTransaction, AppNotification, User } from './src/types';
import fs from 'fs';

const app = express();
const PORT = 3000;

app.use(express.json());

const DB_PATH = path.join(process.cwd(), 'db.json');

// In-Memory Database State
let users: User[] = [
  {
    id: 'user_1',
    name: 'Anirudh P. (Reader)',
    email: 'anirudhpkndl@gmail.com',
    phone: '9446059123',
    walletBalance: 120,
    membershipStatus: 'Premium',
    streak: 4,
    lastActive: new Date().toISOString()
  }
];

let books: Book[] = [...SEEDED_BOOKS];
let reviews: Review[] = [...SEEDED_REVIEWS];
let libraries = [...SEEDED_LIBRARIES];
let rentals: Rental[] = [
  {
    id: 'rent_1',
    userId: 'user_1',
    bookId: 'book_2', // Randamoozham
    libraryId: 'lib_2',
    rentedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // due in 5 days
    returnedDate: null,
    status: 'Delivered',
    trackingCode: 'TRK-KTYM-9912',
    lateFeeCharged: 0
  },
  {
    id: 'rent_2',
    userId: 'user_1',
    bookId: 'book_6', // Naalukettu
    libraryId: 'lib_1',
    rentedDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // overdue by 5 days
    returnedDate: null,
    status: 'Overdue',
    trackingCode: 'TRK-TRV-4188',
    lateFeeCharged: 5
  }
];

let bookRequests: BookRequest[] = [
  {
    id: 'req_1',
    userId: 'user_1',
    bookTitle: 'Mayyazhippuzhayude Theerangalil (മയ്യഴിപ്പുഴയുടെ തീരങ്ങളിൽ)',
    author: 'M. Mukundan',
    genre: 'Novels',
    personalNote: 'A foundational French-mahe postcolonial narrative. I would love to rent it here!',
    priority: true,
    status: 'Pending',
    createdAt: new Date().toISOString()
  }
];

let walletTransactions: WalletTransaction[] = [
  {
    id: 'tx_1',
    userId: 'user_1',
    amount: -10,
    type: 'Rent',
    referenceId: 'REF-RENT10022',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'tx_2',
    userId: 'user_1',
    amount: 100,
    type: 'Recharge',
    referenceId: 'pay_sim_991823',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  }
];

let notifications: AppNotification[] = [
  {
    id: 'notif_1',
    userId: 'user_1',
    title: '⏰ Return Reminder: 5 Days Left',
    message: 'Your rental copy of "Randamoozham" from Trivandrum Royal Granthashala has 5 days left. Keep reading!',
    type: 'reminder',
    createdAt: new Date().toISOString(),
    read: false,
    bookId: 'book_2'
  },
  {
    id: 'notif_2',
    userId: 'user_1',
    title: '⚠️ Overdue Warning & Penalty',
    message: 'Your rental "Naalukettu" has exceeded the 20-day duration. ₹5 late fee has accumulated (₹1/day). Please schedule a return pickup.',
    type: 'warning',
    createdAt: new Date().toISOString(),
    read: false,
    bookId: 'book_6'
  }
];

function saveToDisk() {
  try {
    const data = {
      users,
      books,
      reviews,
      libraries,
      rentals,
      bookRequests,
      walletTransactions,
      notifications
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing db.json file:", err);
  }
}

// Read database file if it exists
try {
  if (fs.existsSync(DB_PATH)) {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed) {
      if (Array.isArray(parsed.users)) users = parsed.users;
      if (Array.isArray(parsed.books)) {
        books = parsed.books.filter((b: any) => {
          const titleEng = String(b.titleEnglish || '').trim().toLowerCase();
          const titleMal = String(b.titleMalayalam || '').trim();
          return titleEng !== 'untitled book' && titleEng !== 'untitled' && titleMal !== 'അജ്ഞാത ശീർഷകം';
        });
      }
      if (Array.isArray(parsed.reviews)) reviews = parsed.reviews;
      if (Array.isArray(parsed.libraries)) libraries = parsed.libraries;
      if (Array.isArray(parsed.rentals)) rentals = parsed.rentals;
      if (Array.isArray(parsed.bookRequests)) bookRequests = parsed.bookRequests;
      if (Array.isArray(parsed.walletTransactions)) walletTransactions = parsed.walletTransactions;
      if (Array.isArray(parsed.notifications)) notifications = parsed.notifications;

      // Persist corrected state right away to clean up the db.json file permanently
      saveToDisk();
    }
  } else {
    // Write defaults to create file
    saveToDisk();
  }
} catch (err) {
  console.error("Error reading db.json database file, using defaults:", err);
}

// Helper to trigger notification on book stock returned / wishlist match
function checkAndNotifyStock(bookId: string) {
  const book = books.find(b => b.id === bookId);
  if (book && book.availableCopies > 0) {
    // Notify users who requested stock alert or added to wishlist
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: 'user_1',
      title: '📚 Stock Restocked!',
      message: `"${book.titleEnglish}" (ബാല്യകാലസഖി) is now available at ${SEEDED_LIBRARIES.find(l=>l.id === book.libraryId)?.name || 'the library'}. Rent it immediately!`,
      type: 'success',
      createdAt: new Date().toISOString(),
      read: false,
      bookId: book.id
    };
    notifications.unshift(notif);
  }
}

// Lazy-initialize Gemini AI
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

// Fallback dynamic responses for Gemini recommender
const MOCK_AI_RECOMMENDATIONS = [
  {
    reason: "Because you liked 'Randamoozham' (Bhima's perspective), Gemini suggests diving deeper into character-driven epic subversions:",
    suggestion: "Ini Njan Urangatte (ഇനി ഞാൻ ഉറങ്ങട്ടെ) by P. K. Balakrishnan",
    blurb: "This exquisite work explores the Mahabharata from Karna's wife Draupadi's tragic realization and Karna's epic martyrdom. Stylistically matching MT Vasudevan Nair's evocative prose."
  },
  {
    reason: "Reflecting your reading history of Vaikom Muhammad Basheer's rustic Malayalam humor and profound humanist themes:",
    suggestion: "Sabdangal (ശബ്ദങ്ങൾ) or Pathummayude Aadu (പാത്തുമ്മയുടെ ആട്)",
    blurb: "A beautiful slice-of-life memoir representing his family, a notorious goat, and the surrounding village, packed with cozy, direct, nostalgic dialogue."
  },
  {
    reason: "Based on Benyamin's intense thriller and migration narrative 'Aadujeevitham':",
    suggestion: "Manjaveyil Maranangal (മഞ്ഞവെയിൽ മരണങ്ങൾ) by Benyamin",
    blurb: "A multi-layered detective meta-fiction blending true memories, historical travel logs in Diego Garcia, and mysterious diaries."
  }
];

const MOCK_BLURBS: Record<string, string> = {
  "default": "This Malayalam masterpiece captures Kerala's cultural roots, nostalgic publication details, and provides a beautiful narrative of social transformation. Recommended for readers wanting to experience Malayalam's rich oral traditions."
};

// =================== API ENDPOINTS ===================

// GET Books catalog
app.get('/api/books', (req, res) => {
  const { genre, search, libraryId } = req.query;
  let filtered = [...books];

  if (genre && genre !== 'All') {
    filtered = filtered.filter(b => b.genre.toLowerCase() === (genre as string).toLowerCase());
  }

  if (search) {
    const term = (search as string).toLowerCase();
    filtered = filtered.filter(b => 
      b.titleEnglish.toLowerCase().includes(term) ||
      b.titleMalayalam.toLowerCase().includes(term) ||
      b.author.toLowerCase().includes(term) ||
      b.genre.toLowerCase().includes(term)
    );
  }

  if (libraryId) {
    filtered = filtered.filter(b => b.libraryId === libraryId);
  }

  res.json(filtered);
});

// GET Single Book details with reviews
app.get('/api/books/:id', (req, res) => {
  const book = books.find(b => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  const bookReviews = reviews.filter(r => r.bookId === book.id);
  res.json({ book, reviews: bookReviews });
});

// POST Review
app.post('/api/books/:id/review', (req, res) => {
  const bookId = req.params.id;
  const { rating, comment, userName, spoilerTag } = req.body;

  if (!comment || !rating) {
    return res.status(400).json({ error: 'Comment and rating are required' });
  }

  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  // Create Review
  const newReview: Review = {
    id: `rev_${Date.now()}`,
    userId: 'user_1',
    userName: userName || 'Anirudh P. (Anonymous)',
    bookId,
    rating: Number(rating),
    comment,
    spoilerTag: !!spoilerTag,
    helpfulVotes: 0,
    isVerifiedRental: rentals.some(r => r.bookId === bookId && r.userId === 'user_1'),
    replyMessage: null
  };

  reviews.push(newReview);

  // Recalculate average book rating
  const bookReviews = reviews.filter(r => r.bookId === bookId);
  const avg = bookReviews.reduce((sum, r) => sum + r.rating, 0) / bookReviews.length;
  book.rating = parseFloat(avg.toFixed(2));
  book.reviewsCount = bookReviews.length;

  saveToDisk();
  res.status(201).json(newReview);
});

// GET Library Partners
app.get('/api/libraries', (req, res) => {
  res.json(libraries);
});

// POST Suggest Unavailable Book (Book Request)
app.post('/api/requests', (req, res) => {
  const { bookTitle, author, genre, personalNote, priority } = req.body;

  if (!bookTitle || !author) {
    return res.status(400).json({ error: 'Book Title and Author are required' });
  }

  const newRequest: BookRequest = {
    id: `req_${Date.now()}`,
    userId: 'user_1',
    bookTitle,
    author,
    genre: genre || 'Novels',
    personalNote: personalNote || '',
    priority: !!priority,
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  bookRequests.unshift(newRequest);
  saveToDisk();
  res.status(201).json(newRequest);
});

app.get('/api/requests', (req, res) => {
  res.json(bookRequests);
});

// PUT Approve/Update Book Requests (Admin Control)
app.put('/api/requests/:id', (req, res) => {
  const reqId = req.params.id;
  const { status } = req.body; // Approved, Purchased, Rejected
  const bReq = bookRequests.find(r => r.id === reqId);
  if (bReq) {
    bReq.status = status;
    saveToDisk();
    res.json(bReq);
  } else {
    res.status(404).json({ error: 'Request not found' });
  }
});

// GET Current User Profile
app.get('/api/user', (req, res) => {
  res.json(users[0]);
});

// POST Recharge User Wallet (Razorpay Simulation)
app.post('/api/wallet/recharge', (req, res) => {
  const { amount, method } = req.body;
  const rechargeAmt = Number(amount);

  if (isNaN(rechargeAmt) || rechargeAmt <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  // Recharge user wallet
  users[0].walletBalance += rechargeAmt;

  // Add transaction
  const referenceId = `pay_rzp_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    userId: 'user_1',
    amount: rechargeAmt,
    type: 'Recharge',
    referenceId,
    createdAt: new Date().toISOString()
  };
  walletTransactions.unshift(tx);

  // Add welcome/success notification
  const notif: AppNotification = {
    id: `notif_${Date.now()}`,
    userId: 'user_1',
    title: '💳 Wallet Recharge Successful',
    message: `₹${rechargeAmt} credited successfully using ${method || 'Razorpay UPI'}. Reference ID: ${referenceId}`,
    type: 'success',
    createdAt: new Date().toISOString(),
    read: false
  };
  notifications.unshift(notif);

  saveToDisk();
  res.json({ user: users[0], transaction: tx });
});

// GET Wallet Transactions
app.get('/api/wallet/transactions', (req, res) => {
  res.json(walletTransactions);
});

// GET App Notifications
app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

// POST Mark Notifications Read
app.post('/api/notifications/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    saveToDisk();
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Notification not found' });
  }
});

// POST Rent Book
app.post('/api/rentals', (req, res) => {
  const { bookId, deliveryAddress } = req.body;
  
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  if (book.availableCopies <= 0) {
    return res.status(400).json({ error: 'Out of stock' });
  }

  if (users[0].walletBalance < 10) {
    return res.status(400).json({ error: 'Insufficient wallet balance. Please recharge ₹10 rental cost.' });
  }

  // Deduct rental charge
  users[0].walletBalance -= 10;
  book.availableCopies -= 1;

  // Create Rental record
  const trkCode = `TRK-${book.titleEnglish.substring(0,4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const newRental: Rental = {
    id: `rent_${Date.now()}`,
    userId: 'user_1',
    bookId: book.id,
    libraryId: book.libraryId,
    rentedDate: new Date().toISOString(),
    dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days duration
    returnedDate: null,
    status: 'Requested',
    trackingCode: trkCode,
    lateFeeCharged: 0
  };

  rentals.unshift(newRental);

  // Record Transaction
  const walletTx: WalletTransaction = {
    id: `tx_${Date.now()}`,
    userId: 'user_1',
    amount: -10,
    type: 'Rent',
    referenceId: `REF-${trkCode}`,
    createdAt: new Date().toISOString()
  };
  walletTransactions.unshift(walletTx);

  // Notification
  const notif: AppNotification = {
    id: `notif_${Date.now()}`,
    userId: 'user_1',
    title: '🚚 Courier Dispatched',
    message: `Your rental order for "${book.titleEnglish}" (ബാല്യകാലസഖി) is scheduled with the courier! Deliveries are included in the Malayalam Literary delivery ecosystem.`,
    type: 'info',
    createdAt: new Date().toISOString(),
    read: false,
    bookId: book.id
  };
  notifications.unshift(notif);

  saveToDisk();
  res.status(201).json({ rental: newRental, user: users[0], transaction: walletTx });
});

// GET Rentals Log
app.get('/api/rentals', (req, res) => {
  const { libraryId } = req.query;
  let responseRentals = rentals.map(r => {
    const book = books.find(b => b.id === r.bookId);
    return {
      ...r,
      bookTitle: book ? book.titleEnglish : 'Unknown Book',
      bookTitleMalayalam: book ? book.titleMalayalam : '',
      coverImage: book ? book.coverImage : '',
      author: book ? book.author : 'Unknown Author'
    };
  });

  if (libraryId) {
    responseRentals = responseRentals.filter(r => r.libraryId === libraryId);
  }

  res.json(responseRentals);
});

// PUT Update Rental Status (Library Partner workflow / Dispatch queue)
app.put('/api/rentals/:id/status', (req, res) => {
  const rentId = req.params.id;
  const { status } = req.body; // Dispatched, Delivered, Returned, etc.

  const rental = rentals.find(r => r.id === rentId);
  if (!rental) {
    return res.status(404).json({ error: 'Rental record not found' });
  }

  rental.status = status;

  if (status === 'Returned') {
    rental.returnedDate = new Date().toISOString();
    
    // Put back into inventory
    const book = books.find(b => b.id === rental.bookId);
    if (book) {
      book.availableCopies = Math.min(book.availableCopies + 1, book.totalCopies);
      // Trigger restocked notification check
      checkAndNotifyStock(book.id);
    }

    // Add refund/transaction if active return clears perfectly
    const refundNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: 'user_1',
      title: '📦 Book Return Approved',
      message: `Your copy of "${book ? book.titleEnglish : 'the book'}" was safely delivered to the library partner and verified. Rent logs refreshed.`,
      type: 'success',
      createdAt: new Date().toISOString(),
      read: false
    };
    notifications.unshift(refundNotif);
  } else if (status === 'Delivered') {
    const delNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: 'user_1',
      title: '📖 Book Delivered!',
      message: `Courier delivered your book to your doorstep! You have 20 days remaining to read. Late fee accumulates at ₹1/day.`,
      type: 'success',
      createdAt: new Date().toISOString(),
      read: false,
      bookId: rental.bookId
    };
    notifications.unshift(delNotif);
  }

  saveToDisk();
  res.json(rental);
});

// GET Library dashboard metrics (per library partner or global)
app.get('/api/metrics', (req, res) => {
  const { libraryId } = req.query;

  let localBooks = books;
  let localRentals = rentals;
  let localReviews = reviews;

  if (libraryId) {
    localBooks = books.filter(b => b.libraryId === libraryId);
    localRentals = rentals.filter(r => r.libraryId === libraryId);
    // Find book IDs of this library
    const bookIds = localBooks.map(b => b.id);
    localReviews = reviews.filter(r => bookIds.includes(r.bookId));
  }

  const activeRentals = localRentals.filter(r => r.status !== 'Returned');
  const returnedRentals = localRentals.filter(r => r.status === 'Returned');
  const overdueRentals = localRentals.filter(r => r.status === 'Overdue');
  
  // Simulated stats
  const totalBooks = localBooks.length;
  const activeCount = activeRentals.length;
  const overdueCount = overdueRentals.length;
  const revenueTotal = localRentals.length * 10; // Simple calculation of rents * ₹10
  const pendingDeliveries = localRentals.filter(r => r.status === 'Requested' || r.status === 'Dispatched').length;

  res.json({
    totalBooks,
    activeRentalsCount: activeCount,
    overdueCount,
    revenue: revenueTotal,
    pendingDeliveries,
    returnedCount: returnedRentals.length,
    reviewsCount: localReviews.length
  });
});

// POST Add new book (Library inventory)
app.post('/api/books', (req, res) => {
  const { titleMalayalam, titleEnglish, author, genre, totalCopies, description, libraryId, isRare, shelfLocation, publicationDetails, coverImage, descriptionMalayalam } = req.body;

  if (!titleMalayalam || !titleEnglish || !author || !totalCopies) {
    return res.status(400).json({ error: 'Malayalam Title, English Title, Author, Genre and Copies count are required.' });
  }

  // Create clean color background
  const colors = [
    'linear-gradient(135deg, #1C1B1F 0%, #3e3d43 100%)',
    'linear-gradient(135deg, #3E5879 0%, #1c2d42 100%)',
    'linear-gradient(135deg, #6E1F28 0%, #461117 100%)',
    'linear-gradient(135deg, #2A3D36 0%, #15221d 100%)',
    'linear-gradient(135deg, #C8A96B 0%, #876d3a 100%)'
  ];
  const randColor = colors[Math.floor(Math.random() * colors.length)];

  const newBook: Book = {
    id: `book_${Date.now()}`,
    titleMalayalam,
    titleEnglish,
    author,
    genre,
    availableCopies: Number(totalCopies),
    totalCopies: Number(totalCopies),
    description: description || 'A masterpiece Malayalam work catalogued in our partner libraries.',
    descriptionMalayalam: descriptionMalayalam || 'ഗ്രന്ഥാലയ ശേഖരത്തിലെ ഉൽകൃഷ്ട കൃതികളിലൊന്ന്.',
    coverImage: coverImage || randColor,
    rentalPrice: 10,
    libraryId: libraryId || 'lib_1',
    rating: 5.0,
    reviewsCount: 0,
    isRare: !!isRare,
    shelfLocation: shelfLocation || 'H-01',
    publicationDetails: publicationDetails || 'Custom Entry Co., 2026'
  };

  books.push(newBook);
  saveToDisk();
  res.status(201).json(newBook);
});

// POST Bulk import books (CSV Import)
app.post('/api/books/bulk', (req, res) => {
  const { books: inputBooks, libraryId } = req.body;

  if (!Array.isArray(inputBooks)) {
    return res.status(400).json({ error: 'An array of books is required.' });
  }

  const colors = [
    'linear-gradient(135deg, #1C1B1F 0%, #3e3d43 100%)',
    'linear-gradient(135deg, #3E5879 0%, #1c2d42 100%)',
    'linear-gradient(135deg, #6E1F28 0%, #461117 100%)',
    'linear-gradient(135deg, #2A3D36 0%, #15221d 100%)',
    'linear-gradient(135deg, #C8A96B 0%, #876d3a 100%)'
  ];

  const now = Date.now();
  const newBooks: Book[] = inputBooks.map((item: any, index: number) => {
    const totalCopies = Number(item.totalCopies) || Number(item.availableCopies) || 1;
    const randColor = colors[(index + Math.floor(Math.random() * colors.length)) % colors.length];
    
    return {
      id: `book_${now}_${index}_${Math.random().toString(36).substring(2, 6)}`,
      titleMalayalam: item.titleMalayalam || 'അജ്ഞാത ശീർഷകം',
      titleEnglish: item.titleEnglish || item.titleMalayalam || 'Untitled Book',
      author: item.author || 'അജ്ഞാത കർത്താവ് (Unknown Author)',
      genre: item.genre || 'Novels',
      availableCopies: totalCopies,
      totalCopies: totalCopies,
      description: item.description || 'A masterpiece Malayalam work catalogued in our partner libraries.',
      descriptionMalayalam: item.descriptionMalayalam || 'ഗ്രന്ഥാലയ ശേഖരത്തിലെ ഉൽകൃഷ്ട കൃതികളിലൊന്ന്.',
      coverImage: item.coverImage || randColor,
      rentalPrice: Number(item.rentalPrice) || 10,
      libraryId: libraryId || item.libraryId || 'lib_4', // Defaults to Cherukad Library (lib_4)
      rating: Number(item.rating) || 5.0,
      reviewsCount: Number(item.reviewsCount) || 0,
      isRare: !!item.isRare,
      shelfLocation: item.shelfLocation || `S-${Math.floor(Math.random() * 20) + 1}`,
      publicationDetails: item.publicationDetails || 'Seeded Publication, 2026'
    };
  });

  books = [...books, ...newBooks];
  
  // Update collectionSize metric for this library
  const libId = libraryId || 'lib_4';
  const targetLib = libraries.find(l => l.id === libId);
  if (targetLib) {
    const branchBooks = books.filter(b => b.libraryId === libId);
    targetLib.collectionSize = branchBooks.length;
  }

  saveToDisk();
  res.status(201).json({ 
    success: true, 
    count: newBooks.length,
    message: `Successfully imported ${newBooks.length} books into library ${libId}`
  });
});

// GET Admin Global Multi-Tenant moderation state
app.get('/api/admin/moderation', (req, res) => {
  res.json({
    users,
    libraries,
    totalBooks: books.length,
    totalRentals: rentals.length,
    requests: bookRequests,
    reviews
  });
});

// POST Approve Library Verification (Admin Action)
app.put('/api/libraries/:id/verify', (req, res) => {
  const lib = libraries.find(l => l.id === req.params.id);
  if (lib) {
    lib.isVerified = !lib.isVerified;
    saveToDisk();
    res.json(lib);
  } else {
    res.status(404).json({ error: 'Library not found' });
  }
});

// POST Save full database arrays for spreadsheet manual edits
app.post('/api/sheet/save', (req, res) => {
  const { table, data, libraryId } = req.body;

  if (!table || !Array.isArray(data)) {
    return res.status(400).json({ error: 'table name and data array are required.' });
  }

  try {
    if (table === 'books') {
      if (libraryId) {
        // Multi-tenant: merge updated library books with books of other libraries
        const otherLibsBooks = books.filter(b => b.libraryId !== libraryId);
        // Force libraryId on incoming data to prevent security/tenant leakage
        const sanitized = data.map((b: any) => ({ ...b, libraryId }));
        books = [...otherLibsBooks, ...sanitized];
      } else {
        // PlatformAdmin overrides everything
        books = data;
      }
    } else if (table === 'rentals') {
      if (libraryId) {
        // Multi-tenant: merge updated library dispatches with dispatches of other libraries
        const otherLibsRentals = rentals.filter(r => r.libraryId !== libraryId);
        const sanitized = data.map((r: any) => ({ ...r, libraryId }));
        rentals = [...otherLibsRentals, ...sanitized];
      } else {
        // PlatformAdmin overrides everything
        rentals = data;
      }
    } else if (table === 'users') {
      // Users are Admin only
      users = data;
    } else if (table === 'requests') {
      // Sourcing requests are Admin only
      bookRequests = data;
    } else if (table === 'libraries') {
      // Libraries list is Admin only
      libraries = data;
    } else {
      return res.status(400).json({ error: `Unknown table: ${table}` });
    }

    saveToDisk();
    return res.json({ success: true, count: data.length });
  } catch (err: any) {
    console.error("Sheet save error:", err);
    return res.status(500).json({ error: err.message || 'Failed to modify backend state.' });
  }
});

// =================== GEMINI AI ENDPOINTS ===================

// AI Smart Recommendations Endpoint
app.post('/api/ai/recommend', async (req, res) => {
  const { readingHistory, preferredGenre } = req.body;

  const aiClient = getGeminiClient();
  if (!aiClient) {
    // Graceful fallback to rich mock recommendations
    console.log("Gemini API key not found. Serving high-fidelity cached suggestions instead.");
    return res.json({
      recommendations: MOCK_AI_RECOMMENDATIONS,
      isMocked: true,
      providerMessage: "Displaying curated suggestions. Configure your GEMINI_API_KEY inside the secrets panel to enable real-time local intelligence."
    });
  }

  try {
    const prompt = `
      You are an expert Malayalam literary curator or librarian with deep knowledge of Kerala classics and contemporary Malayalam publishing.
      A user is looking for book recommendations on our home delivery platform "LIB".
      
      User Context:
      - Preferred Genres: ${preferredGenre || 'Classic Novels'}
      - Recently Read / In History: ${JSON.stringify(readingHistory || ['Balyakalasakhi', 'Randamoozham'])}
      
      Please recommend 3 excellent real Malayalam literary masterpieces (classics or prominent modern novels/poetry/biographies) that are highly acclaimed.
      Provide the response in raw JSON format, containing a key "recommendations" which is an array.
      Each item in the array must have three properties:
      1. "reason": A brief elegant sentence matching the user's history and why they would love this book.
      2. "suggestion": The book title (with Malayalam letters in parenthesis, e.g., "Oru Sankeerthanam Pole (ഒരു സങ്കീർത്തനം പോലെ)").
      3. "blurb": A 2-sentence gripping summary of the book's narrative plot, author details, and critical significance.

      Respond ONLY with valid JSON. Do not include markdown code block characters.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    let text = response.text || '';
    // Clean code blocks if returned
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);
    return res.json({
      recommendations: result.recommendations || result,
      isMocked: false
    });
  } catch (error: any) {
    console.error("Gemini AI recommendation failed:", error);
    // Return mock fallback as backup rather than failing the web page
    return res.json({
      recommendations: MOCK_AI_RECOMMENDATIONS,
      isMocked: true,
      error: error.message
    });
  }
});

// AI Automatic Translation & Blurb Summary generator for adding books
app.post('/api/ai/describe', async (req, res) => {
  const { bookTitle, author } = req.body;

  if (!bookTitle) {
    return res.status(400).json({ error: 'Book Title is required' });
  }

  const aiClient = getGeminiClient();
  const gradients = [
    'linear-gradient(135deg, #1C1B1F 0%, #3e3d43 100%)',
    'linear-gradient(135deg, #3E5879 0%, #1c2d42 100%)',
    'linear-gradient(135deg, #6E1F28 0%, #461117 100%)',
    'linear-gradient(135deg, #2A3D36 0%, #15221d 100%)',
    'linear-gradient(135deg, #C8A96B 0%, #876d3a 100%)'
  ];
  const randColor = gradients[Math.floor(Math.random() * gradients.length)];

  if (!aiClient) {
    const fallbackText = `"${bookTitle}" is an exquisite, highly celebrated literary work written by ${author || 'renowned author'}. It encapsulates traditional Kerala culture, deep sentimental realities, and provides an unmatched Malayalam linguistic experience. Rental includes home delivery under the LIB ecosystem.`;
    return res.json({
      descriptionEnglish: fallbackText,
      descriptionMalayalam: `ക്ലാസിക് മലയാള സാഹിത്യത്തിലെ ഈ അമൂല്യ കൃതി വായനക്കാരുടെ മനസ്സ് കീഴടക്കും. വീട്ടുവാതിൽക്കൽ പുസ്തകങ്ങളെത്തിക്കുന്ന ലിബ് ഡെലിവറി വഴി ഇതു നിങ്ങളുടെ അരികിലെത്തുന്നു.`,
      coverImage: randColor,
      suggestedAuthor: author || 'Celebrated Author',
      suggestedGenre: 'Novels',
      suggestedPublicationDetails: 'Kerala Sahitya Academy, 2026',
      isMocked: true
    });
  }

  try {
    const prompt = `
      Please search the web for details of the book "${bookTitle}" by "${author || 'any Author'}". Find and generate:
      1. An elegant English blurb/synopsis of the book (max 3 sentences) suitable for a premium library brochure.
      2. An accurate Malayalam description of the book in native script (മലയാളം ലിപിയിൽ, max 2 sentences) describing the core sentimental theme.
      3. A hotlinkable public direct cover image URL (e.g. from openlibrary.org/b/id/... or commons.wikimedia.org, goodreads, or similar hotlinkable image URLs).
         CRITICAL: If a direct cover image URL is not found, generate a beautiful, descriptive CSS linear-gradient background matching the theme of the book (e.g., 'linear-gradient(135deg, #1C1B1F 0%, #3e3d43 100%)', or containing elegant rich tones of sage, deep blue, gold, burgundy).
      4. The correct/accurate author name (if misspelled or empty).
      5. The publication details/info if found, formatted nicely (e.g., "Publisher, Year").
      6. The library genre among: Novels, Poetry, Thriller, History, Biography, Drama, Spiritual, Political, Cinema, Science, Philosophy.
    `;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            descriptionEnglish: { type: Type.STRING },
            descriptionMalayalam: { type: Type.STRING },
            coverImage: { type: Type.STRING, description: "Direct cover image URL or CSS linear-gradient background string" },
            suggestedAuthor: { type: Type.STRING },
            suggestedGenre: { type: Type.STRING },
            suggestedPublicationDetails: { type: Type.STRING }
          },
          required: ["descriptionEnglish", "descriptionMalayalam", "coverImage"]
        }
      }
    });

    let text = response.text || '';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(text);
    res.json({
      descriptionEnglish: result.descriptionEnglish,
      descriptionMalayalam: result.descriptionMalayalam,
      coverImage: result.coverImage || randColor,
      suggestedAuthor: result.suggestedAuthor || author,
      suggestedGenre: result.suggestedGenre || 'Novels',
      suggestedPublicationDetails: result.suggestedPublicationDetails || 'Seeded Library Press, 2026',
      isMocked: false
    });
  } catch (error: any) {
    const fallbackText = `"${bookTitle}" by ${author || 'celebrated author'} represents a key piece of Kerala literature. Available now for home delivery.`;
    res.json({
      descriptionEnglish: fallbackText,
      descriptionMalayalam: `മലയാള സാഹിത്യത്തിലെ അതിവിശിഷ്ട കൃതിയായ ഇത് ഇപ്പോൾ ഞങ്ങളുടെ കോട്ടയം ഡലിവറി നെറ്റ്‌വർക്ക് വഴി ലഭ്യമാണ്.`,
      coverImage: randColor,
      suggestedAuthor: author || 'Celebrated Author',
      suggestedGenre: 'Novels',
      suggestedPublicationDetails: 'Seeded Library Press, 2026',
      isMocked: true,
      error: error.message
    });
  }
});


// AI Image Generation for custom book cover
app.post('/api/ai/generate-cover', async (req, res) => {
  const { bookTitle, author, styleDescription } = req.body;

  if (!bookTitle) {
    return res.status(400).json({ error: 'Book Title is required to generate a cover' });
  }

  const aiClient = getGeminiClient();
  const colors = [
    'linear-gradient(135deg, #1C1B1F 0%, #3e3d43 100%)',
    'linear-gradient(135deg, #3E5879 0%, #1c2d42 100%)',
    'linear-gradient(135deg, #6E1F28 0%, #461117 100%)',
    'linear-gradient(135deg, #2A3D36 0%, #15221d 100%)',
    'linear-gradient(135deg, #C8A96B 0%, #876d3a 100%)'
  ];
  const randColor = colors[Math.floor(Math.random() * colors.length)];

  if (!aiClient) {
    return res.json({
      coverImage: randColor,
      isMocked: true,
      msg: 'API key not configured. Fallback to design gradients.'
    });
  }

  try {
    const prompt = `A professional, stunning, minimalist book cover artwork for the book titled "${bookTitle}" by "${author || 'Unknown Malayalam Author'}" with a premium artistic aesthetic. Style request: ${styleDescription || 'classic hand-painted watercolor portrait representing traditional Kerala nature, with deep mood hues'}. Create a gorgeous aesthetic design, NO text overlay or letters, focusing only on the symbolic abstract background illustrations.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    let base64Image = '';
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        base64Image = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!base64Image) {
      throw new Error('No image returned from Gemini models');
    }

    res.json({
      coverImage: base64Image,
      isMocked: false
    });
  } catch (error: any) {
    res.json({
      coverImage: randColor,
      isMocked: true,
      error: error.message
    });
  }
});


// =================== VITE STATIC OUTLET MIDDLEWARE ===================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LIB server] Server running at http://localhost:${PORT}`);
  });
}

startServer();
