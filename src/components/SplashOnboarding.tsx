/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { BookOpen, MapPin, Truck, HelpCircle } from 'lucide-react';

interface SplashOnboardingProps {
  onComplete: () => void;
}

export default function SplashOnboarding({ onComplete }: SplashOnboardingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 md:p-12 relative overflow-hidden bg-slate-50">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300 opacity-10 rounded-full blur-3xl"></div>
      
      {/* Decorative Modern Corner Brackets */}
      <div className="absolute top-8 left-8 w-16 h-16 border-t-2 border-l-2 border-indigo-200 opacity-60"></div>
      <div className="absolute top-8 right-8 w-16 h-16 border-t-2 border-r-2 border-indigo-200 opacity-60"></div>
      <div className="absolute bottom-8 left-8 w-16 h-16 border-b-2 border-l-2 border-indigo-200 opacity-60"></div>
      <div className="absolute bottom-8 right-8 w-16 h-16 border-b-2 border-r-2 border-indigo-200 opacity-60"></div>
 
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl text-center z-10"
      >
        {/* Logo Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl flex items-center justify-center shadow-lg border-2 border-indigo-500 relative">
            <BookOpen className="w-10 h-10 text-indigo-400" />
            <span className="absolute -bottom-1 -right-1 text-2xl">📚</span>
          </div>
        </div>
 
        {/* Brand Name & Tagline */}
        <h1 className="font-serif text-5xl md:text-6xl font-black tracking-tight text-slate-900 mb-3">
          LIB
        </h1>
        
        <p className="font-sans text-sm text-indigo-600 tracking-widest uppercase font-bold mb-6">
          &ldquo;Malayalam Literature Delivered to Your Doorstep&rdquo;
        </p>
 
        {/* Cultured Malayalam Quote Panel - Bento Styled */}
        <blockquote className="my-8 p-6 bg-white border border-slate-200 rounded-3xl shadow-xs text-left max-w-lg mx-auto bento-card-hover">
          <p className="font-serif text-slate-800 text-lg leading-relaxed italic font-medium">
            &ldquo;വായിച്ചാലും വളരും വായിച്ചില്ലെങ്കിലും വളരും. വായിച്ചാൽ വിളയും, വായിച്ചില്ലെങ്കിൽ വളയും.&rdquo;
          </p>
          <cite className="block text-right mt-2 text-xs font-semibold font-mono tracking-wider text-indigo-600">
            — കുഞ്ഞുണ്ണി മാഷ് (Kunhunni Mash)
          </cite>
        </blockquote>
 
        {/* Feature Grid with icons - Bento Box Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left my-8 max-w-xl mx-auto">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all duration-300">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2 font-bold">
              <BookOpen className="w-5 h-5 flex-shrink-0 text-indigo-500" />
              <span>Explore Classics</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Access seed catalogs of rare books & modern novels.</p>
          </div>
 
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all duration-300">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2 font-bold">
              <Truck className="w-5 h-5 flex-shrink-0 text-indigo-500" />
              <span>Doorstep Renting</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">Rent for 20 days with inclusive courier postages.</p>
          </div>
 
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-indigo-300 transition-all duration-300">
            <div className="flex items-center space-x-2 text-indigo-600 mb-2 font-bold">
              <MapPin className="w-5 h-5 flex-shrink-0 text-indigo-500" />
              <span>Log Your Books</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">you can log all yor books here.</p>
          </div>
        </div>
 
        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="mt-4 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-lg rounded-2xl shadow-md transition-colors focus:ring-2 focus:ring-indigo-500/50 flex items-center space-x-3.5 mx-auto cursor-pointer"
        >
          <span>ഗ്രന്ഥശാലയിലേക്ക് പ്രവേശിക്കുക</span>
          <span className="text-xs px-2 py-1 bg-black/20 rounded-lg font-mono">Enter Platform</span>
        </motion.button>
 
        <p className="text-xs text-slate-400 mt-6 font-mono">
          Styled with Ultra-Modern Bento Grid Design Theme
        </p>
      </motion.div>
    </div>
  );
}
