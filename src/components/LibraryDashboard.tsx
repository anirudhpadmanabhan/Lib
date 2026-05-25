/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, RefreshCw, Sparkles, Edit, BookOpen, Clock, AlertTriangle, TrendingUp, Inbox,
  FileSpreadsheet, Upload, Trash, FileText, HelpCircle
} from 'lucide-react';
import { Book, Rental, Review } from '../types';
import InteractiveSheetEditor from './InteractiveSheetEditor';

interface LibraryDashboardProps {
  libraryId: string;
  books: Book[];
  rentals: Rental[];
  libraries: any[];
  onRefreshData: () => void;
}

export default function LibraryDashboard({
  libraryId,
  books,
  rentals,
  libraries,
  onRefreshData
}: LibraryDashboardProps) {
  const currentLibrary = libraries.find(l => l.id === libraryId) || libraries[0];

  // Dashboard Tab state
  const [activeTab, setActiveTab] = useState<'metrics' | 'inventory' | 'dispatch' | 'reviews' | 'sheet'>('metrics');

  // Metrics hook state
  const [metrics, setMetrics] = useState({
    totalBooks: 0,
    activeRentalsCount: 0,
    overdueCount: 0,
    revenue: 0,
    pendingDeliveries: 0,
    returnedCount: 0,
    reviewsCount: 0
  });

  // Adding book state
  const [titleMalayalam, setTitleMalayalam] = useState('');
  const [titleEnglish, setTitleEnglish] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState('Novels');
  const [totalCopies, setTotalCopies] = useState('3');
  const [descriptionEnglish, setDescriptionEnglish] = useState('');
  const [descriptionMalayalam, setDescriptionMalayalam] = useState('');
  const [shelfLocation, setShelfLocation] = useState('A-01');
  const [publicationDetails, setPublicationDetails] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [styleDescription, setStyleDescription] = useState('watercolor, abstract design, traditional Kerala nature');
  const [loadingAiCover, setLoadingAiCover] = useState(false);
  const [enhancedCsvBooks, setEnhancedCsvBooks] = useState<Record<number, any>>({});
  const [loadingCsvRows, setLoadingCsvRows] = useState<Record<number, boolean>>({});

  // CSV Import States
  const [importMode, setImportMode] = useState<'single' | 'csv'>('single');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvParsedRows, setCsvParsedRows] = useState<any[][]>([]);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvMapping, setCsvMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSuccessCount, setImportSuccessCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Parse CSV function
  const parseCSV = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentVal = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentVal.trim());
        if (row.length > 0 && row.some(val => val !== '')) {
          lines.push(row);
        }
        row = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentVal || row.length > 0) {
      row.push(currentVal.trim());
      if (row.some(val => val !== '')) {
        lines.push(row);
      }
    }
    return lines;
  };

  const transliterateMalayalamToEnglish = (text: string) => {
    const mapping: Record<string, string> = {
      'അ': 'A', 'ആ': 'Aa', 'ഇ': 'I', 'ഈ': 'Ee', 'ഉ': 'U', 'ഊ': 'Oo', 'ഋ': 'Ri',
      'എ': 'E', 'ഏ': 'Ae', 'ഐ': 'Ai', 'ഒ': 'O', 'ഓ': 'Oo', 'ഔ': 'Au',
      'ക': 'Ka', 'ഖ': 'Kha', 'ഗ': 'Ga', 'ഘ': 'Gha', 'ങ': 'Nga',
      'ച': 'Cha', 'ഛ': 'Chha', 'ജ': 'Ja', 'ഝ': 'Jha', 'ഞ': 'Nya',
      'ട': 'Ta', 'ഠ': 'Tha', 'ഡ': 'Da', 'ഢ': 'Dha', 'ണ': 'Na',
      'ത': 'Tha', 'ഥ': 'Thha', 'ദ': 'Da', 'ധ': 'Dha', 'ന': 'Na',
      'പ': 'Pa', 'ഫ': 'Pha', 'ബ': 'Ba', 'ഭ': 'Bha', 'മ': 'Ma',
      'യ': 'Ya', 'ര': 'Ra', 'ല': 'La', 'വ': 'Va', 'ശ': 'Sha', 'ഷ': 'Sha', 'സ': 'Sa', 'ഹ': 'Ha',
      'ള': 'La', 'ഴ': 'Zha', 'റ': 'Ra', 'റ്റ': 'Tra'
    };
    
    let result = '';
    for (let char of text) {
      if (mapping[char]) {
        result += mapping[char].toLowerCase();
      } else if (char.match(/[a-zA-Z\s0-9()\-&.,]/)) {
        result += char;
      }
    }
    if (result.length > 0) {
      result = result.charAt(0).toUpperCase() + result.slice(1);
    }
    return result || 'Malayalam Classic';
  };

  const generate4447Books = () => {
    const booksList: any[] = [];
    const roots = [
      { mal: 'ആയിരത്തൊന്നു രാവുകൾ', eng: 'Ayirathonnu Ravukal' },
      { mal: 'ധർമ്മരാജാ', eng: 'Dharmaraja' },
      { mal: 'ശാകുന്തളം', eng: 'Shakunthalam' },
      { mal: 'മാർത്താണ്ഡവർമ്മ', eng: 'Marthandavarma' },
      { mal: 'ഖസാക്കിന്റെ ഇതിഹാസം', eng: 'Khasakkinte Ithihasam' },
      { mal: 'ആടുജീവിതം', eng: 'Aadujeevitham' },
      { mal: 'ബാല്യകാലസഖി', eng: 'Balyakalasakhi' },
      { mal: 'രണ്ടാമൂഴം', eng: 'Randamoozham' },
      { mal: 'ഒരു സങ്കീർത്തനം പോലെ', eng: 'Oru Sankeerthanam Pole' },
      { mal: 'കയർ', eng: 'Kayar' },
      { mal: 'നാലുകെട്ട്', eng: 'Naalukettu' },
      { mal: 'ചെമ്മീൻ', eng: 'Chemmeen' },
      { mal: 'ശബ്ദങ്ങൾ', eng: 'Sabdangal' },
      { mal: 'സുന്ദരികളും സുന്ദരന്മാരും', eng: 'Sundarikalum Sundaranmarum' },
      { mal: 'ഭാർഗ്ഗവീനിലയം', eng: 'Bhargavi Nilayam' },
      { mal: 'പ്രേമലേഖനം', eng: 'Premalekhanam' },
      { mal: 'കാപ്പിരികളുടെ നാട്ടിൽ', eng: 'Kaapirikalude Nattil' },
      { mal: 'ഒരു ദേശത്തിന്റെ കഥ', eng: 'Oru Desathinte Katha' },
      { mal: 'അരനാഴികനേരം', eng: 'Aranazhikaneram' },
      { mal: 'പുന്നപ്ര വയലാർ', eng: 'Punnapra Vayalar' },
      { mal: 'ഗുരുസാഗരം', eng: 'Guru Sagaram' },
      { mal: 'ഓടയിൽ നിന്ന്', eng: 'Odayil Ninnu' },
      { mal: 'അഗ്നിസാക്ഷി', eng: 'Agnisakshi' },
      { mal: 'രണ്ടിടങ്ങഴി', eng: 'Randitangazhi' },
      { mal: 'തോട്ടിയുടെ മകൻ', eng: 'Thottiyude Makan' },
      { mal: 'ലന്തൻബത്തേരിയിലെ ലുത്തിനിയകൾ', eng: 'Lanthanbatheriyile Luthiniyakal' },
      { mal: 'ആലഹായുടെ പെൺമക്കൾ', eng: 'Alahayude Penmakkal' },
      { mal: 'തീക്കടൽ കടഞ്ഞ് തിരുമധുരം', eng: 'Theekadal Katanju Thirumadhuram' },
      { mal: 'ഒരു തെരുവിന്റെ കഥ', eng: 'Oru Theruvinte Katha' },
      { mal: 'ബാല്യം', eng: 'Balyam' }
    ];

    const suffixes = [
      { mal: 'മഹത് വചനങ്ങൾ', eng: 'Mahath Vachanangal' },
      { mal: 'കവിതകൾ', eng: 'Kavithakal' },
      { mal: 'സ്മരണകൾ', eng: 'Smaranakal' },
      { mal: 'ലേഖനങ്ങൾ', eng: 'Lekhanangal' },
      { mal: 'കഥകൾ', eng: 'Kathakal' },
      { mal: 'ആത്മകഥ', eng: 'Atmakatha' },
      { mal: 'നാടകങ്ങൾ', eng: 'Nadakangal' },
      { mal: 'പ്രബന്ധങ്ങൾ', eng: 'Prabandhangal' },
      { mal: 'ചриത്രസംഗ്രഹം', eng: 'Charithra Sangraham' },
      { mal: 'ചിന്താഗതികൾ', eng: 'Chinthagathikal' },
      { mal: 'യാത്രാവിവരണം', eng: 'Yathra Vivaranam' }
    ];

    const authors = [
      'വൈക്കം മുഹമ്മദ് ബഷീർ (Vaikom Muhammad Basheer)',
      'എം. ടി. വാസുദേവൻ നായർ (M. T. Vasudevan Nair)',
      'തകഴി ശിവശങ്കരപ്പിള്ള (Thakazhi Sivasankara Pillai)',
      'എസ്. കെ. പൊറ്റെക്കാട്ട് (S. K. Pottekkatt)',
      'മാധവിക്കുട്ടി (Madhavikutty)',
      'ഒ. വി. വിജയൻ (O. V. Vijayan)',
      'ചെറുകാട് ഗോവിന്ദ പിഷാരടി (Cherukad)',
      'മലയാറ്റൂർ രാമകൃഷ്ണൻ (Malayattoor)',
      'പി. കേശവദേവ് (P. Kesavadev)',
      'എം. മുകുന്ദൻ (M. Mukundan)',
      'കെ. സച്ചിദാനന്ദൻ (K. Satchidanandan)',
      'ലളിതാംബിക അന്തർജ്ജനം (Lalithambika)',
      'കെ. ആർ. മീര (K. R. Meera)',
      'ബെന്യാമിൻ (Benyamin)'
    ];

    const genres = ['Novels', 'Poetry', 'Thriller', 'History', 'Biography', 'Drama', 'Spiritual', 'Political', 'Cinema', 'Science', 'Philosophy'];
    const publishers = ['DC Books', 'Current Books', 'Poorna Publications', 'Chintha Publishers', 'NSP India'];

    let count = 0;
    for (let r = 0; r < roots.length; r++) {
      for (let s = 0; s < suffixes.length; s++) {
        for (let v = 0; v < 14; v++) {
          if (count >= 4447) break;
          
          const root = roots[r];
          const suffix = suffixes[s];
          
          const titleMal = `${root.mal} & ${suffix.mal} (ഭാഗം ${v + 1})`;
          const titleEng = `${root.eng} & ${suffix.eng} (Vol ${v + 1})`;
          const author = authors[(r + s + v) % authors.length];
          const genre = genres[(r * s + v) % genres.length];
          const publisher = publishers[(r + v) % publishers.length];
          
          booksList.push({
            titleMalayalam: titleMal,
            titleEnglish: titleEng,
            author: author,
            genre: genre,
            totalCopies: 1,
            availableCopies: 1,
            shelfLocation: `S-${(r % 20) + 1}-${String.fromCharCode(65 + (s % 6))}${v + 1}`,
            publicationDetails: `${publisher}, ${1950 + (v * 5)} (Edition V${v + 1})`,
            description: `A highly acclaimed piece on Malayalam ${genre.toLowerCase()} literature, combining ${root.eng} and ${suffix.eng} narrative devices in Volume ${v + 1}.`,
            descriptionMalayalam: `മലയാള ${genre.toLowerCase()} സാഹിത്യ രംഗത്തെ പ്രധാന നാഴികക്കല്ലായ ${root.mal} കൃതിയുടെ ഭാഗം ${v + 1} പതിപ്പ്.`
          });
          count++;
        }
      }
    }

    while (count < 4447) {
      const root = roots[count % roots.length];
      booksList.push({
        titleMalayalam: `${root.mal} (അധിക പതിപ്പ് ${count})`,
        titleEnglish: `${root.eng} (Extra Vol ${count})`,
        author: authors[count % authors.length],
        genre: genres[count % genres.length],
        totalCopies: 1,
        availableCopies: 1,
        shelfLocation: `A-${count % 100}`,
        publicationDetails: `DC Books, 2026`,
        description: `Historical standard book volume catalogued dynamically under LIB.`,
        descriptionMalayalam: `ലിബ് വിതരണ ശൃംഖലയിൽ ഉൾപ്പെടുത്തിയ അമൂല്യ മലയാള ഗ്രന്ഥ ശേഖരം.`
      });
      count++;
    }

    return booksList;
  };

  const handleCsvSelect = (text: string) => {
    setCsvRawText(text);
    const parsed = parseCSV(text);
    if (parsed.length === 0) {
      alert("Selected file is empty or invalid format.");
      return;
    }
    
    setCsvParsedRows(parsed);

    // Set default headers or indices
    const columnsCount = Math.max(...parsed.map(r => r.length));
    const generatedColumns = Array.from({ length: columnsCount }, (_, i) => `Col ${i + 1}`);
    setCsvColumns(generatedColumns);

    const mapping: Record<string, string> = {};
    const sampleRow = parsed[0] || [];
    
    sampleRow.forEach((val, index) => {
      const colStr = String(val).toLowerCase();
      const isMalayalam = /[\u0D00-\u0D7F]/.test(colStr);
      
      if (isMalayalam && !mapping['titleMalayalam']) {
        mapping[index.toString()] = 'titleMalayalam';
      } else if (isMalayalam && mapping['titleMalayalam'] && !mapping['author']) {
        if (colStr.length < 50) {
          mapping[index.toString()] = 'author';
        } else {
          mapping[index.toString()] = 'description';
        }
      } else if (!isMalayalam && colStr.match(/^[a-z\s,\.\-&()]+$/i) && colStr.length > 3) {
        if (colStr.toLowerCase().includes('book') || colStr.toLowerCase().includes('novel') || colStr.length > 20) {
          if (!mapping['titleEnglish']) mapping[index.toString()] = 'titleEnglish';
        } else if (!mapping['author'] && colStr.length < 30) {
          mapping[index.toString()] = 'author';
        }
      } else if (colStr.match(/^\d+$/)) {
        if (!mapping['totalCopies']) mapping[index.toString()] = 'totalCopies';
      }
    });

    setCsvMapping(mapping);
  };

  const executeBulkImport = async (booksArray: any[]) => {
    setImporting(true);
    setImportProgress(0);
    setImportSuccessCount(0);

    const chunkSize = 500;
    const totalCount = booksArray.length;
    let successCount = 0;

    for (let i = 0; i < totalCount; i += chunkSize) {
      const chunk = booksArray.slice(i, i + chunkSize);
      
      try {
        const response = await fetch('/api/books/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            books: chunk,
            libraryId: libraryId
          })
        });

        if (response.ok) {
          successCount += chunk.length;
          setImportSuccessCount(successCount);
          setImportProgress(Math.round((successCount / totalCount) * 100));
        } else {
          console.error("Failed to import batch starting at index", i);
        }
      } catch (err) {
        console.error("Error posting batch", err);
      }
    }

    setImporting(false);
    onRefreshData();
    fetchMetrics();
    setSuccessMsg(`Fabulous! Bulk imported exactly ${successCount} titles into your library branch!`);
    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
    
    setCsvParsedRows([]);
    setCsvRawText('');
  };

  const handleTriggerMockSeed4447 = () => {
    const generated = generate4447Books();
    executeBulkImport(generated);
  };

  const handleProceedCSVImport = () => {
    if (csvParsedRows.length === 0) return;

    const structuredBooks: any[] = csvParsedRows.map((row: any, rowIndex: number) => {
      const b: any = {};
      
      Object.entries(csvMapping).forEach(([colIndex, targetField]) => {
        const fieldName = targetField as string;
        if (fieldName !== 'none' && (row as any)[Number(colIndex)] !== undefined) {
          b[fieldName] = (row as any)[Number(colIndex)];
        }
      });

      if (b.titleMalayalam && !b.titleEnglish) {
        b.titleEnglish = transliterateMalayalamToEnglish(b.titleMalayalam);
      }

      b.totalCopies = Number(b.totalCopies) || 1;
      b.availableCopies = b.totalCopies;

      // Merge AI search enhanced updates if they exist for this row!
      if (enhancedCsvBooks[rowIndex]) {
        const enhanced = enhancedCsvBooks[rowIndex];
        b.coverImage = enhanced.coverImage;
        b.description = enhanced.descriptionEnglish;
        b.descriptionMalayalam = enhanced.descriptionMalayalam;
        if (enhanced.suggestedAuthor) b.author = enhanced.suggestedAuthor;
        if (enhanced.suggestedGenre) b.genre = enhanced.suggestedGenre;
        if (enhanced.suggestedPublicationDetails) b.publicationDetails = enhanced.suggestedPublicationDetails;
      }

      return b;
    });

    executeBulkImport(structuredBooks);
    setEnhancedCsvBooks({});
  };

  const handleEnhanceCsvRow = async (rowIndex: number, title: string, bookAuthor: string) => {
    if (!title) return;
    setLoadingCsvRows(prev => ({ ...prev, [rowIndex]: true }));
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle: title, author: bookAuthor })
      });
      const data = await res.json();
      if (data && !data.error) {
        setEnhancedCsvBooks(prev => ({
          ...prev,
          [rowIndex]: {
            coverImage: data.coverImage,
            descriptionEnglish: data.descriptionEnglish,
            descriptionMalayalam: data.descriptionMalayalam,
            suggestedAuthor: data.suggestedAuthor,
            suggestedGenre: data.suggestedGenre,
            suggestedPublicationDetails: data.suggestedPublicationDetails,
            isEnhanced: true
          }
        }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCsvRows(prev => ({ ...prev, [rowIndex]: false }));
    }
  };

  const getMappedPreviewBooks = () => {
    return csvParsedRows.slice(0, 5).map((row: any) => {
      const b: any = {};
      Object.entries(csvMapping).forEach(([colIndex, targetField]) => {
        const fieldName = targetField as string;
        if (fieldName !== 'none' && (row as any)[Number(colIndex)] !== undefined) {
          b[fieldName] = (row as any)[Number(colIndex)];
        }
      });
      if (b.titleMalayalam && !b.titleEnglish) {
        b.titleEnglish = transliterateMalayalamToEnglish(b.titleMalayalam);
      }
      return b;
    });
  };
  
  // Gemini AI autofill state
  const [loadingAiDescribe, setLoadingAiDescribe] = useState(false);
  const [aiAutofilled, setAiAutofilled] = useState(false);
  const [aiMsg, setAiMsg] = useState('');

  // Editing book state
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [editCopies, setEditCopies] = useState(0);

  // Success message banners
  const [successMsg, setSuccessMsg] = useState('');

  // Submitting reply state
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<Record<string, boolean>>({});

  // Fetch local metrics
  const fetchMetrics = () => {
    fetch(`/api/metrics?libraryId=${libraryId}`)
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(err => console.error("Could not load branch metrics:", err));
  };

  useEffect(() => {
    fetchMetrics();
    onRefreshData();
  }, [libraryId, activeTab]);

  // Autofill descriptions via Gemini AI
  const handleAutofillDescriptions = async () => {
    if (!titleEnglish) {
      alert("Please provide the English Book Title first, so Gemini can search and summarize!");
      return;
    }
    setLoadingAiDescribe(true);
    setAiMsg('');
    setAiAutofilled(false);
    
    try {
      const res = await fetch('/api/ai/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle: titleEnglish, author })
      });
      const data = await res.json();
      if (data.descriptionEnglish) {
        setDescriptionEnglish(data.descriptionEnglish);
        if (data.descriptionMalayalam) {
          setDescriptionMalayalam(data.descriptionMalayalam);
        }
        if (data.coverImage) {
          setCoverImage(data.coverImage);
        }
        if (data.suggestedAuthor && (!author || author.trim() === '')) {
          setAuthor(data.suggestedAuthor);
        }
        if (data.suggestedGenre) {
          setGenre(data.suggestedGenre);
        }
        if (data.suggestedPublicationDetails) {
          setPublicationDetails(data.suggestedPublicationDetails);
        }
        
        setAiAutofilled(true);
        if (data.isMocked) {
          setAiMsg('Loaded default templates & custom color gradients. Create a GEMINI_API_KEY inside Settings > Secrets to activate real-time search grounded covers and blurbs.');
        } else {
          setAiMsg('Successfully retrieved best blurb summaries and cover image style using gemini-3.5-flash with live search grounding!');
        }
      }
    } catch (e) {
      console.error(e);
      setAiMsg('Received server error while contacting AI service. Standard fallback applied.');
    } finally {
      setLoadingAiDescribe(false);
    }
  };

  // AI Image generator for book cover
  const handleGenerateCover = async () => {
    if (!titleEnglish) {
      alert("Please provide the English Book Title first, so the model has design context!");
      return;
    }
    setLoadingAiCover(true);
    setAiMsg('');
    try {
      const res = await fetch('/api/ai/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookTitle: titleEnglish, author, styleDescription })
      });
      const data = await res.json();
      if (data.coverImage) {
        setCoverImage(data.coverImage);
        if (data.isMocked) {
          setAiMsg('Mocked cover gradient generated. Configure your GEMINI_API_KEY inside Settings > Secrets to generate base64 cover images.');
        } else {
          setAiMsg('✓ Brand new custom cover artwork drafted successfully using gemini-2.5-flash-image!');
        }
      }
    } catch (e) {
      console.error(e);
      setAiMsg('Failed to generate cover image artwork.');
    } finally {
      setLoadingAiCover(false);
    }
  };

  // Submit Rent State changes (Dispatch queue)
  const handleUpdateStatus = async (rentId: string, status: 'Dispatched' | 'Delivered' | 'Returned') => {
    try {
      const res = await fetch(`/api/rentals/${rentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        onRefreshData();
        fetchMetrics();
        setSuccessMsg(`Courier status successfully moved to ${status}!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit adding new book
  const handleSubmitBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleMalayalam || !titleEnglish || !author || !totalCopies) return;

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleMalayalam,
          titleEnglish,
          author,
          genre,
          totalCopies,
          description: descriptionEnglish,
          descriptionMalayalam,
          libraryId,
          shelfLocation,
          publicationDetails,
          coverImage
        })
      });
      if (res.ok) {
        setTitleMalayalam('');
        setTitleEnglish('');
        setAuthor('');
        setDescriptionEnglish('');
        setDescriptionMalayalam('');
        setShelfLocation('A-01');
        setPublicationDetails('');
        setCoverImage('');
        setAiAutofilled(false);
        setSuccessMsg('✨ Seed Classic added successfully to library inventory shelves!');
        setSelectedBookCount();
        onRefreshData();
        fetchMetrics();
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Trigger Local reviews refresh
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const fetchAllReviews = () => {
    // Collect all reviews for current library's books
    const libBookIds = books.filter(b => b.libraryId === libraryId).map(b => b.id);
    fetch('/api/admin/moderation')
      .then(res => res.json())
      .then(data => {
        if (data.reviews) {
          const matched = data.reviews.filter((r: any) => libBookIds.includes(r.bookId));
          setAllReviews(matched);
        }
      });
  };

  useEffect(() => {
    if (activeTab === 'reviews') {
      fetchAllReviews();
    }
  }, [activeTab, libraryId, books]);

  // Reply Review handler
  const handleReplyReview = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;

    setSubmittingReply(prev => ({ ...prev, [reviewId]: true }));
    try {
      const response = await fetch('/api/admin/moderation');
      const data = await response.json();
      const targetReview = data.reviews.find((r: any) => r.id === reviewId);
      if (targetReview) {
        targetReview.replyMessage = text;
        // Trigger reviews local refresh
        fetchAllReviews();
        setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  const setSelectedBookCount = () => {
    // Helper
  };

  const localLibraryBooks = books.filter(b => b.libraryId === libraryId);
  const localLibraryRentals = rentals.filter(r => r.libraryId === libraryId);

  return (
    <div className="bg-slate-50 min-h-screen text-[#0f172a]">
      
      {/* Banner - Bento Style */}
      <div className="max-w-7xl mx-auto px-4 pt-6">
        <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <span className="text-4xl p-3 bg-slate-50 rounded-2xl border border-slate-200">{currentLibrary?.logo || '🏛️'}</span>
              <div>
                <h2 className="font-serif text-2xl font-black text-slate-900 tracking-tight">{currentLibrary?.name}</h2>
                <p className="text-xs text-slate-500 mt-1 font-sans">
                  Owner/Librarian: <strong className="text-slate-800">{currentLibrary?.ownerName}</strong> &bull; {currentLibrary?.location}
                </p>
              </div>
            </div>
            <div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono px-3.5 py-1.5 rounded-full font-extrabold uppercase tracking-wide">
                ✓ Verified Partner Node
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Bento Styled Tab Toggle Nav */}
        <div className="flex space-x-1.5 bg-slate-200/50 p-1 rounded-2xl mb-8 overflow-x-auto max-w-max border border-slate-200">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'metrics' ? 'bg-indigo-650 bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            Branch Analytics
          </button>
          
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            Shelf Inventory
          </button>

          <button
            onClick={() => setActiveTab('dispatch')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'dispatch' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            Dispatch Queue ({localLibraryRentals.filter(r=>r.status !== 'Returned').length})
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'reviews' ? 'bg-indigo-650 bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            Reader Reviews ({allReviews.length})
          </button>

          <button
            id="library-nav-sheet-btn"
            onClick={() => setActiveTab('sheet')}
            className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'sheet' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600 hover:text-slate-950 hover:bg-white/40'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Interactive Sheet Editor</span>
          </button>
        </div>

        {/* Success Alert Banner */}
        {successMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-bold font-mono">
            ✓ {successMsg}
          </div>
        )}

        {/* ----------------- METRICS PANEL (BENTO ARCHITECTURE) ----------------- */}
        {activeTab === 'metrics' && (
          <div className="space-y-6">
            
            {/* Quick Summary Counts (Four Elegant Bento Boxes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Total Seed Books</span>
                <div className="text-3xl font-mono font-black text-slate-900 mt-2">{metrics.totalBooks} Titles</div>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                  Shelved locally in branch
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Active Leases</span>
                <div className="text-3xl font-mono font-black text-indigo-600 mt-2">{metrics.activeRentalsCount} Active</div>
                <div className="text-xs text-rose-600 font-bold mt-1 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Overdue: {metrics.overdueCount} copies
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Revenue Collected</span>
                <div className="text-3xl font-mono font-black text-emerald-600 mt-2">₹{metrics.revenue}</div>
                <div className="text-xs text-slate-400 mt-1">₹10 flat lease rate per book</div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs bento-card-hover">
                <span className="text-[10px] text-slate-400 block uppercase font-mono tracking-wider font-bold">Pending Deliveries</span>
                <div className="text-3xl font-mono font-black text-amber-600 mt-2">{metrics.pendingDeliveries} orders</div>
                <div className="text-xs text-amber-600 font-bold mt-1">Awaiting courier dispatch</div>
              </div>

            </div>

            {/* Custom Bar Graphs & Heatmaps in Bento Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Graphic container */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
                  <h4 className="font-sans font-black text-slate-900 text-sm flex items-center space-x-1.5">
                    <TrendingUp className="w-4 h-4 text-indigo-600" />
                    <span>Lease Pipeline Operations</span>
                  </h4>
                  <span className="text-[9px] font-mono bg-slate-100 text-slate-500 rounded px-2 py-0.5">Monthly</span>
                </div>
                
                <div className="h-44 w-full flex items-end justify-between px-2 pt-6">
                  <div className="flex flex-col items-center flex-1">
                    <div className="text-[9px] font-mono text-slate-400">Total</div>
                    <div className="w-12 bg-slate-100 rounded-t-xl h-24 flex items-end justify-center relative">
                      <div className="w-full bg-indigo-600 rounded-t-xl text-white font-mono text-[9px] font-bold text-center flex items-center justify-center" style={{ height: '75%' }}>{localLibraryRentals.length}</div>
                    </div>
                    <div className="text-[10px] mt-2 font-bold text-slate-600">Leases</div>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <div className="text-[9px] font-mono text-slate-400 font-bold">Success</div>
                    <div className="w-12 bg-slate-100 rounded-t-xl h-24 flex items-end justify-center relative">
                      <div className="w-full bg-emerald-600 rounded-t-xl text-white font-mono text-[9px] font-bold text-center flex items-center justify-center" style={{ height: '40%' }}>{metrics.returnedCount}</div>
                    </div>
                    <div className="text-[10px] mt-2 font-bold text-slate-600">Returned</div>
                  </div>

                  <div className="flex flex-col items-center flex-1">
                    <div className="text-[9px] font-mono text-slate-400">Current</div>
                    <div className="w-12 bg-slate-100 rounded-t-xl h-24 flex items-end justify-center relative">
                      <div className="w-full bg-amber-550 bg-amber-500 rounded-t-xl text-white font-mono text-[9px] font-bold text-center flex items-center justify-center animate-pulse" style={{ height: '30%' }}>{metrics.activeRentalsCount}</div>
                    </div>
                    <div className="text-[10px] mt-2 font-bold text-slate-600">Delivering</div>
                  </div>
                </div>
              </div>

              {/* Demand Heatmap */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-150 pb-3 mb-4">
                  <h4 className="font-sans font-black text-slate-900 text-sm flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Wishlist Demand Heatmap</span>
                  </h4>
                  <span className="text-[9px] font-mono bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase">Critical stock</span>
                </div>
                
                <p className="text-[11px] text-slate-500 mb-4 leading-relaxed font-sans">
                  The following seeded titles at your <strong>{currentLibrary?.name}</strong> match user wishlist counts. Consider increasing copies to prevent out-of-stock indicators.
                </p>

                <div className="space-y-2.5">
                  {localLibraryBooks.slice(0, 3).map(b => (
                    <div key={b.id} className="bg-slate-50 rounded-2xl p-3 text-xs flex justify-between items-center border border-slate-100 bento-card-hover">
                      <div>
                        <strong className="text-slate-800 font-serif">{b.titleEnglish}</strong>
                        <div className="text-[10px] text-slate-400 mt-0.5">{b.author}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono font-bold block text-indigo-600 uppercase">Heat Score: HIGH</span>
                        <span className="text-[9px] bg-indigo-550 bg-slate-900 text-white px-2 py-0.5 rounded-full font-mono font-bold mt-1 inline-block">
                          {b.availableCopies === 0 ? 'RESTOCK REQUIRED' : `${b.availableCopies} Left`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ----------------- INVENTORY MANAGEMENT ----------------- */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Shelf catalog table list */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex justify-between items-center border-b pb-3 mb-4">
                <h3 className="font-sans font-black text-slate-900 text-md">Branch Shelf Books ({localLibraryBooks.length})</h3>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">Physical shelving</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-120 overflow-y-auto pr-1">
                {localLibraryBooks.map(book => (
                  <div key={book.id} className="py-3.5 flex items-center justify-between text-xs text-slate-905">
                    <div className="flex items-center space-x-3.5">
                      <div
                        style={{
                          background: book.coverImage ? (book.coverImage.startsWith('http') || book.coverImage.startsWith('data:image') ? `url("${book.coverImage}") center/cover no-repeat` : book.coverImage) : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                        }}
                        className="h-12 w-8.5 rounded shadow-xs text-white flex-shrink-0 text-center font-serif font-bold text-[8px] flex items-center justify-center opacity-80"
                      >
                        {(!book.coverImage || (!book.coverImage.startsWith('http') && !book.coverImage.startsWith('data:image'))) && "Grad"}
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-slate-900">{book.titleEnglish}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{book.author} &bull; Shelf: {book.shelfLocation || 'A-1'}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-4">
                      <div>
                        {editingBookId === book.id ? (
                          <div className="flex items-center space-x-1">
                            <input
                              type="number"
                              value={editCopies}
                              onChange={(e)=>setEditCopies(Number(e.target.value))}
                              className="w-12 bg-slate-100 p-1.5 rounded-lg font-mono text-center text-xs border border-slate-200 focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                book.availableCopies = editCopies;
                                book.totalCopies = editCopies;
                                setEditingBookId(null);
                              }}
                              className="p-1 px-2.5 bg-indigo-650 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
                            >
                              ✓
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-650 text-slate-900 font-black block">{book.availableCopies}/{book.totalCopies} copies</span>
                        )}
                        <span className="text-[9px] text-slate-400 block">Available</span>
                      </div>

                      <button
                        onClick={() => {
                          setEditingBookId(book.id);
                          setEditCopies(book.totalCopies);
                        }}
                        className="p-1.5 text-slate-450 hover:text-indigo-600 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Addition & CSV Import Column */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                {/* Switcher Header */}
                <div className="flex border-b border-slate-100 pb-3 mb-4 items-center justify-between">
                  <div className="flex space-x-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImportMode('single')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        importMode === 'single'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Single Book
                    </button>
                    <button
                      type="button"
                      onClick={() => setImportMode('csv')}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                        importMode === 'csv'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <FileSpreadsheet className="w-3 h-3 text-indigo-500" />
                      <span>Bulk CSV Upload</span>
                    </button>
                  </div>

                  {libraryId === 'lib_4' && (
                    <button
                      type="button"
                      onClick={handleTriggerMockSeed4447}
                      disabled={importing}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10.5px] rounded-lg font-black border border-emerald-200 transition-all flex items-center space-x-1 cursor-pointer"
                      title="Instantly generate and insert 4,447 classical academic monographs and catalog books into Cherukad branch database!"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600 animate-pulse" />
                      <span>Instant Seed 4,447</span>
                    </button>
                  )}
                </div>

                {importing && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl mb-4 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-indigo-900">Uploading assets index...</span>
                      <span className="font-mono text-indigo-700">{importProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      Moved {importSuccessCount} records. Keep window open.
                    </p>
                  </div>
                )}

                {importMode === 'single' ? (
                  /* SINGLE BOOK ADDITION FORM */
                  <form onSubmit={handleSubmitBook} className="space-y-4 text-xs">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                      <PlusCircle className="w-4 h-4" />
                      <strong className="text-slate-800 text-xs">Add Single Book Catalog</strong>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Malayalam Title (മലയാളം ലിപിയിൽ)</label>
                      <input
                        type="text"
                        required
                        value={titleMalayalam}
                        onChange={(e)=>setTitleMalayalam(e.target.value)}
                        placeholder="e.g. മയ്യഴിപ്പുഴയുടെ തീരങ്ങളിൽ"
                        className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-serif"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">English Title Transliteration</label>
                      <input
                        type="text"
                        required
                        value={titleEnglish}
                        onChange={(e)=>setTitleEnglish(e.target.value)}
                        placeholder="e.g. Mayyazhippuzhayude Theerangalil"
                        className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Author</label>
                        <input
                          type="text"
                          required
                          value={author}
                          onChange={(e)=>setAuthor(e.target.value)}
                          placeholder="e.g. M. Mukundan"
                          className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Copies count</label>
                        <input
                          type="number"
                          required
                          value={totalCopies}
                          onChange={(e)=>setTotalCopies(e.target.value)}
                          className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Genre Category</label>
                      <select
                        value={genre}
                        onChange={(e)=>setGenre(e.target.value)}
                        className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 text-xs"
                      >
                        <option value="Novels">Novels</option>
                        <option value="Poetry">Poetry</option>
                        <option value="Thriller">Thriller</option>
                        <option value="History">History</option>
                        <option value="Biography">Biography</option>
                        <option value="Drama">Drama</option>
                        <option value="Spiritual">Spiritual</option>
                        <option value="Political">Political</option>
                        <option value="Cinema">Cinema</option>
                        <option value="Science">Science</option>
                        <option value="Philosophy">Philosophy</option>
                      </select>
                    </div>

                    {/* Gemini Autofill Button */}
                    <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
                      <div className="max-w-[70%]">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase font-mono block">Intelligent Ingress helper</span>
                        <p className="text-[9.5px] text-slate-500 mt-0.5">Gemini will search index to autofill bilingual descriptions!</p>
                      </div>

                      <button
                        type="button"
                        onClick={handleAutofillDescriptions}
                        disabled={loadingAiDescribe}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-[10.5px] flex items-center space-x-1 cursor-pointer transition-colors"
                      >
                        {loadingAiDescribe ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-white" />}
                        <span>Gemini Fill</span>
                      </button>
                    </div>

                    {aiAutofilled && (
                      <div className="p-2.5 bg-indigo-50 text-indigo-700 text-[10.5px] rounded-xl border border-indigo-100 font-semibold">
                        ✓ Autofilled summaries! Verify fields below.
                      </div>
                    )}

                    <div>
                      <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Brochure Description (English)</label>
                      <textarea
                        value={descriptionEnglish}
                        onChange={(e)=>setDescriptionEnglish(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 rounded-xl py-2 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      ></textarea>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Native blurb description (മലയാളം ലിപിയിൽ)</label>
                      <textarea
                        value={descriptionMalayalam}
                        onChange={(e)=>setDescriptionMalayalam(e.target.value)}
                        rows={2}
                        className="w-full bg-slate-50 rounded-xl py-2 px-3 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-serif"
                      ></textarea>
                    </div>

                    {/* Cover Artwork Setting Option with AI search autofill background */}
                    <div className="bg-slate-50 border border-slate-250 p-4 rounded-2xl space-y-3.5 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Book Cover Visual & Blurb settings</span>
                        <span className="text-[8.5px] font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">AI Grounded Search enabled</span>
                      </div>
                      
                      <div className="flex gap-3 items-center">
                        {/* Live Cover Preview Panel */}
                        <div
                          style={{
                            background: coverImage ? (coverImage.startsWith('http') || coverImage.startsWith('data:image') ? `url("${coverImage}") center/cover no-repeat` : coverImage) : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                          }}
                          className="h-24 w-16 rounded-xl shadow-md border border-slate-300 text-[8px] font-serif font-black text-white flex-shrink-0 flex items-center justify-center text-center p-1 relative overflow-hidden"
                        >
                          {coverImage ? (
                            (!coverImage.startsWith('http') && !coverImage.startsWith('data:image')) && (
                              <span className="drop-shadow-md text-[9px]">Gradients Visual</span>
                            )
                          ) : (
                            <span className="text-slate-400">Blank</span>
                          )}
                        </div>

                        <div className="flex-1 space-y-1.5 min-w-0">
                          <label className="text-[9.5px] font-mono font-bold text-slate-500 uppercase block">Cover URL or CSS Gradient background</label>
                          <input
                            type="text"
                            value={coverImage}
                            onChange={(e) => setCoverImage(e.target.value)}
                            placeholder="e.g. https://... OR linear-gradient(...)"
                            className="w-full bg-white text-slate-800 rounded-xl py-2 px-3 border text-xs border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                          />
                          <p className="text-[8.5px] text-slate-400">Autofilled automatically during "Gemini Fill" or can be manually overridden!</p>
                        </div>
                      </div>

                      {/* AI Custom-Image Cover Generation Mode */}
                      <div className="border-t border-slate-200/60 pt-3 space-y-2">
                        <label className="text-[9.5px] font-mono font-bold text-slate-500 uppercase block">🎨 AI Cover Artwork Illustrator</label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={styleDescription}
                            onChange={(e) => setStyleDescription(e.target.value)}
                            placeholder="e.g. watercolor Oil painting, cozy traditional village in Kerala, golden hour"
                            className="flex-1 bg-white text-slate-800 rounded-xl py-2 px-3 border text-xs border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateCover}
                            disabled={loadingAiCover}
                            className="px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold rounded-xl text-[10.5px] cursor-pointer whitespace-nowrap transition-colors"
                          >
                            {loadingAiCover ? "Drawing..." : "Draft Cover Art"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pb-2">
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Cabinet Shelf code</label>
                        <input
                          type="text"
                          value={shelfLocation}
                          onChange={(e)=>setShelfLocation(e.target.value)}
                          placeholder="e.g. A-12"
                          className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-semibold text-slate-500 block mb-1 font-mono text-[10px] uppercase">Publisher details</label>
                        <input
                          type="text"
                          value={publicationDetails}
                          onChange={(e)=>setPublicationDetails(e.target.value)}
                          placeholder="e.g. DC Books, 1999"
                          className="w-full bg-slate-50 rounded-xl py-2.5 px-3 border border-slate-200 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow cursor-pointer text-xs transition-colors"
                    >
                      Confirm shelving to branch catalog
                    </button>
                  </form>
                ) : (
                  /* BULK CSV IMPORT PANEL */
                  <div className="space-y-4 text-xs">
                    <div className="flex items-center space-x-2 text-indigo-600 mb-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      <strong className="text-slate-800 text-xs">CSV Bulk Catalogue Importer</strong>
                    </div>

                    {csvParsedRows.length === 0 ? (
                      /* File Drag-and-Drop Dropzone */
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              if (evt.target?.result) handleCsvSelect(evt.target.result as string);
                            };
                            reader.readAsText(file);
                          }
                        }}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                          dragOver ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50/30'
                        }`}
                      >
                        <input
                          type="file"
                          accept=".csv"
                          id="csv-file-picker"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) handleCsvSelect(evt.target.result as string);
                              };
                              reader.readAsText(file);
                            }
                          }}
                        />
                        <label htmlFor="csv-file-picker" className="cursor-pointer">
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="font-bold text-slate-700">Drag & Drop CSV File here</p>
                          <p className="text-[10px] text-slate-400 mt-1">or click to browse local folders</p>
                        </label>

                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-center space-x-1.5 text-[9.5px] text-slate-500 font-mono">
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded border">Malayalam Book List format</span>
                        </div>
                      </div>
                    ) : (
                      /* Import Mapping Setup screen */
                      <div className="space-y-4">
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex justify-between items-center text-[11px]">
                          <div>
                            <span className="font-black text-indigo-900 block">✓ Parse Complete!</span>
                            <span className="text-slate-500 mt-0.5 block">Detected <strong className="text-indigo-800">{csvParsedRows.length}</strong> catalogs rows</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setCsvParsedRows([]); setCsvRawText(''); }}
                            className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                          >
                            Clear File
                          </button>
                        </div>

                        {/* Attribute Mapping Section */}
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-400 block mb-2">Configure Columns Mapping:</span>
                          <div className="space-y-2 bg-slate-50 border border-slate-200 p-3 rounded-2xl max-h-[180px] overflow-y-auto">
                            {csvColumns.map((colName, index) => (
                              <div key={index} className="flex items-center justify-between text-[11px] border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                                <div className="max-w-[50%] overflow-hidden">
                                  <span className="font-bold text-slate-700 block">{colName}</span>
                                  <span className="text-[10px] text-slate-400 truncate block">
                                    Demo: &quot;{String(csvParsedRows[0]?.[index] || '').substring(0, 20)}&quot;
                                  </span>
                                </div>
                                <select
                                  value={csvMapping[index.toString()] || 'none'}
                                  onChange={(e) => {
                                    setCsvMapping(prev => ({ ...prev, [index.toString()]: e.target.value }));
                                  }}
                                  className="bg-white border rounded-lg px-2 py-1 text-[10px] text-slate-700 max-w-[50%] focus:ring-1 focus:ring-indigo-500 outline-none"
                                >
                                  <option value="none">Ignore (Don&apos;t Import)</option>
                                  <option value="titleMalayalam">Malayalam Title (മലയാളം)</option>
                                  <option value="titleEnglish">English Title (Transliteration)</option>
                                  <option value="author">Author Name</option>
                                  <option value="genre">Genre Option</option>
                                  <option value="totalCopies">Available copies count</option>
                                  <option value="shelfLocation">Shelving Rack code</option>
                                  <option value="publicationDetails">Publication Info</option>
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Live Parser Review & AI Search Grounded Enhancement */}
                        <div className="space-y-2.5 border-t border-slate-200/80 pt-3.5">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-black uppercase tracking-wider font-mono text-indigo-700">
                              Live Mapped Book preview ({Math.min(csvParsedRows.length, 5)} rows):
                            </span>
                            <span className="text-slate-400 font-mono font-bold">Auto-cover & Blurb Setting</span>
                          </div>
                          
                          <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                            {getMappedPreviewBooks().map((pBook, idx) => {
                              const enhanced = enhancedCsvBooks[idx];
                              const isEnhanced = !!enhanced;
                              const isRowLoading = !!loadingCsvRows[idx];
                              const displayCoverImage = isEnhanced ? enhanced.coverImage : null;
                              const displayTitle = pBook.titleEnglish || pBook.titleMalayalam || `Untitled Row ${idx + 1}`;
                              
                              return (
                                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-3 shadow-xs">
                                  <div className="flex items-center gap-2 max-w-[70%] min-w-0">
                                    {/* Cover Preview */}
                                    <div
                                      style={{
                                        background: displayCoverImage ? (displayCoverImage.startsWith('http') || displayCoverImage.startsWith('data:image') ? `url("${displayCoverImage}") center/cover no-repeat` : displayCoverImage) : 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)'
                                      }}
                                      className="h-12 w-8.5 rounded border border-slate-300 shadow-sm flex-shrink-0 text-[6px] text-white flex items-center justify-center font-serif text-center font-black relative overflow-hidden"
                                    >
                                      {!displayCoverImage && "Grad"}
                                    </div>

                                    <div className="min-w-0">
                                      <h4 className="font-bold text-slate-800 truncate text-[11px]">
                                        {displayTitle}
                                      </h4>
                                      <p className="text-[9px] text-slate-400 truncate">
                                        Author: {pBook.author || 'Unspecified'} &bull; Shelf: {pBook.shelfLocation || 'Auto'}
                                      </p>
                                      {isEnhanced && (
                                        <span className="inline-block mt-0.5 text-[8.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 font-mono">
                                          ✓ AI Cover & Blurb Setup
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isRowLoading || (!pBook.titleEnglish && !pBook.titleMalayalam)}
                                    onClick={() => handleEnhanceCsvRow(idx, pBook.titleEnglish || pBook.titleMalayalam, pBook.author || '')}
                                    className={`px-2.5 py-1.5 rounded-lg text-[9.5px] font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                                      isEnhanced 
                                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-250' 
                                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                                    }`}
                                  >
                                    {isRowLoading ? (
                                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-700" />
                                    ) : (
                                      <Sparkles className="w-3 h-3 text-indigo-500" />
                                    )}
                                    <span>{isEnhanced ? "Update Art" : "AI Search"}</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setCsvParsedRows([]); setCsvRawText(''); }}
                            className="flex-1 py-2 border border-slate-200 hover:border-slate-300 text-slate-600 rounded-xl font-bold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleProceedCSVImport}
                            disabled={importing}
                            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-sm cursor-pointer"
                          >
                            Import Now ({csvParsedRows.length})
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Guidance Card */}
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-start space-x-2 text-[10px] text-slate-500 leading-relaxed font-mono">
                      <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>CSV Mapping Guide:</strong> Make sure columns are separated by commas. Ensure at least one column is mapped to Malayalam Title, as other details can be auto-generated phonetically!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ----------------- DISPATCH QUEUE & STATUS UPDATER ----------------- */}
        {activeTab === 'dispatch' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-sans font-black text-slate-900 text-lg">Branch Delivery Pipelines</h3>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100 font-bold">Courier Queue</span>
            </div>

            {localLibraryRentals.filter(r=>r.status !== 'Returned').length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">No shipments currently in delivery queue for your branch.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 uppercase text-[9px] font-mono border-b border-slate-200">
                      <th className="py-3.5 px-3">Tracking Code</th>
                      <th className="py-3.5 px-3">Title Details</th>
                      <th className="py-3.5 px-3">Check Date</th>
                      <th className="py-3.5 px-3">Live Status</th>
                      <th className="py-3.5 px-3 text-right">Actions / courier trigger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localLibraryRentals.filter(r=>r.status !== 'Returned').map(rent => (
                      <tr key={rent.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{rent.trackingCode}</td>
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 font-serif">{rent.bookTitle}</strong>
                          <div className="text-[10px] text-slate-400">{rent.author}</div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{new Date(rent.rentedDate).toLocaleDateString()}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                            rent.status === 'Requested' ? 'bg-amber-50 text-amber-600 border border-amber-200' : rent.status === 'Dispatched' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          }`}>
                            {rent.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1">
                          
                          {rent.status === 'Requested' && (
                            <button
                              onClick={() => handleUpdateStatus(rent.id, 'Dispatched')}
                              className="px-3 py-1.5 bg-indigo-650 bg-slate-900 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Dispatch Courier
                            </button>
                          )}

                          {rent.status === 'Dispatched' && (
                            <button
                              onClick={() => handleUpdateStatus(rent.id, 'Delivered')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                            >
                              Deliver to Reader
                            </button>
                          )}

                          <button
                            onClick={() => handleUpdateStatus(rent.id, 'Returned')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-xl transition-all cursor-pointer"
                          >
                            Mark Returned
                          </button>

                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ----------------- CUSTOMER REVIEWS MODERATOR ----------------- */}
        {activeTab === 'reviews' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="font-sans font-black text-slate-900 text-lg">Reader Feedback Moderation</h3>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-3 py-1 rounded-full">Interactive Reviews</span>
            </div>
            
            {allReviews.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-8 text-center bg-slate-50 rounded-2xl border border-slate-100">No reviews written for your branch catalog titles yet.</p>
            ) : (
              <div className="space-y-4">
                {allReviews.map(rev => {
                  const book = books.find(b => b.id === rev.bookId);
                  return (
                    <div key={rev.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-900 grid grid-cols-1 md:grid-cols-12 gap-4 bento-card-hover">
                      
                      <div className="md:col-span-8 space-y-2">
                        <div className="font-bold flex items-center space-x-1.5 text-slate-800">
                          <span className="text-slate-900 font-semibold">{rev.userName} &bull;</span>
                          <span className="text-slate-400 text-[10px]">Title: &quot;{book ? book.titleEnglish : 'Unknown'}&quot;</span>
                        </div>
                        <p className="italic font-serif text-slate-800 text-[13px] leading-relaxed">&ldquo;{rev.comment}&rdquo;</p>
                        
                        {rev.replyMessage && (
                          <div className="mt-3 pl-3.5 border-l-2 border-indigo-500 font-mono text-[10.5px] text-slate-500 bg-white p-3 rounded-2xl border border-slate-150">
                            <strong>Published Reply:</strong> {rev.replyMessage}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-4 flex flex-col justify-end space-y-2">
                        {!rev.replyMessage && (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={replyText[rev.id] || ''}
                              onChange={(e) => setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))}
                              placeholder="Type library reply..."
                              className="w-full bg-white p-2 text-[11px] rounded-xl border border-slate-200 focus:outline-none"
                            />
                            <button
                              onClick={() => handleReplyReview(rev.id)}
                              disabled={submittingReply[rev.id]}
                              className="w-full py-2 bg-indigo-650 bg-slate-900 text-white rounded-xl font-bold text-[10px] cursor-pointer transition-colors"
                            >
                              {submittingReply[rev.id] ? 'Posting...' : 'Post Authoritative Reply'}
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ----------------- INTERACTIVE DATABASE SHEETS CLIENT ----------------- */}
        {activeTab === 'sheet' && (
          <InteractiveSheetEditor
            libraryId={libraryId}
            role="LibraryPartner"
            books={books}
            rentals={rentals}
            onRefreshData={onRefreshData}
          />
        )}

      </div>
    </div>
  );
}
