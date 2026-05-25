/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  membershipStatus: 'Standard' | 'Premium' | 'Literary Patron';
  streak: number;
  lastActive: string | null;
}

export interface Book {
  id: string;
  titleMalayalam: string;
  titleEnglish: string;
  author: string;
  genre: string;
  availableCopies: number;
  totalCopies: number;
  description: string;
  descriptionMalayalam?: string;
  coverImage: string;
  rentalPrice: number; // ₹10 default
  libraryId: string;
  rating: number;
  reviewsCount: number;
  isRare?: boolean;
  shelfLocation?: string;
  shelfCode?: string;
  language?: string;
  publicationDetails?: string;
}

export interface Rental {
  id: string;
  userId: string;
  bookId: string;
  libraryId: string;
  rentedDate: string;
  dueDate: string;
  returnedDate: string | null;
  status: 'Requested' | 'Dispatched' | 'Delivered' | 'Returned' | 'Overdue';
  trackingCode: string;
  lateFeeCharged: number;
  bookTitle?: string;
  bookTitleMalayalam?: string;
  coverImage?: string;
  author?: string;
}

export interface Wishlist {
  id: string;
  userId: string;
  bookId: string;
  notifyOnAvailability: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  bookId: string;
  rating: number; // 1 to 5
  comment: string; // Malayalam comments supported
  spoilerTag: boolean;
  helpfulVotes: number;
  isVerifiedRental: boolean;
  replyMessage: string | null;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'Rent' | 'Recharge' | 'Refund' | 'Penalty';
  referenceId: string;
  createdAt: string;
}

export interface LibraryPartner {
  id: string;
  name: string;
  ownerName: string;
  email: string;
  description: string;
  location: string;
  rating: number;
  collectionSize: number;
  isVerified: boolean;
  logo: string;
  deliveryZones: string[];
}

export interface BookRequest {
  id: string;
  userId: string;
  bookTitle: string;
  author: string;
  genre: string;
  personalNote: string;
  priority: boolean;
  status: 'Pending' | 'Approved' | 'Purchased' | 'Rejected';
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'reminder' | 'warning' | 'success';
  createdAt: string;
  read: boolean;
  bookId?: string;
}
