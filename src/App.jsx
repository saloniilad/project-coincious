import React, { useState, useEffect, useRef } from 'react';
import { 
  Coins, 
  Wallet, 
  Lock, 
  CheckCircle2, 
  ArrowLeft, 
  ChevronRight, 
  LogOut, 
  Trophy,
  Star,
  BookOpen, 
  Heart,
  HelpCircle,
  Lightbulb,
  Volume2,
  Sparkles,
  Gamepad2,
  Car,
  Play,
  PartyPopper,
  User,
  Users,
  ShoppingBag,
  Gift,
  Book as BookIcon,
  Shirt,
  RotateCcw,
  Trash2,
  Apple,
  Cookie,
  IceCream
} from 'lucide-react';

// --- UTILS: Gemini TTS Integration ---
const apiKey = ""; 

const pcmToWav = (pcmBase64, sampleRate = 24000) => {
  const byteCharacters = atob(pcmBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const pcmData = new Uint8Array(byteNumbers);
  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + pcmData.length, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, pcmData.length, true);
  const combined = new Uint8Array(wavHeader.byteLength + pcmData.length);
  combined.set(new Uint8Array(wavHeader), 0);
  combined.set(pcmData, wavHeader.byteLength);
  return URL.createObjectURL(new Blob([combined], { type: 'audio/wav' }));
};

const speak = async (text) => {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Say in a warm, encouraging voice: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } } }
        }
      })
    });
    const result = await response.json();
    const pcmData = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (pcmData) {
      const audioUrl = pcmToWav(pcmData);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  } catch (error) {
    const msg = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(msg);
  }
};

// --- DATA: Word Problems with Shopping Items ---
const WORD_PROBLEMS_DATA = {
  "title": "Shopping with Money",
  "level": "special_education",
  "total_questions": 5,
  "instructions": "Drag the right money into the wallet to pay for the item!",
  "problems": [
    {
      "id": 1,
      "item": "banana",
      "itemName": "Banana",
      "price": 5,
      "question": "Buy a Banana for ₹5"
    },
    {
      "id": 2,
      "item": "cookie",
      "itemName": "Cookie",
      "price": 10,
      "question": "Buy a Cookie for ₹10"
    },
    {
      "id": 3,
      "item": "ice-cream",
      "itemName": "Ice Cream",
      "price": 20,
      "question": "Buy Ice Cream for ₹20"
    },
    {
      "id": 4,
      "item": "toy",
      "itemName": "Toy Car",
      "price": 50,
      "question": "Buy a Toy Car for ₹50"
    },
    {
      "id": 5,
      "item": "book",
      "itemName": "Story Book",
      "price": 100,
      "question": "Buy a Story Book for ₹100"
    }
  ]
};

// Item Icon Component
const ShoppingItemIcon = ({ type, size = "lg" }) => {
  const items = {
    banana: { icon: Apple, color: 'bg-yellow-100 text-yellow-600 border-yellow-300' },
    cookie: { icon: Cookie, color: 'bg-amber-100 text-amber-600 border-amber-300' },
    'ice-cream': { icon: IceCream, color: 'bg-pink-100 text-pink-600 border-pink-300' },
    toy: { icon: Car, color: 'bg-blue-100 text-blue-600 border-blue-300' },
    book: { icon: BookIcon, color: 'bg-purple-100 text-purple-600 border-purple-300' }
  };
  
  const item = items[type] || items.banana;
  const Icon = item.icon;
  const sizeClass = size === "lg" ? "w-32 h-32" : "w-20 h-20";
  const iconSize = size === "lg" ? 64 : 40;
  
  return (
    <div className={`${sizeClass} rounded-3xl border-4 ${item.color} flex items-center justify-center shadow-xl`}>
      <Icon size={iconSize} strokeWidth={2.5} />
    </div>
  );
};

// --- DATA: Addition Problems from JSON ---
const ADDITION_DATA = {
  "title": "Addition with Indian Currency – Special Education",
  "level": "special_education",
  "total_questions": 20,
  "instructions": "Look at the money. Count it. Choose the correct total.",
  "problems": [
    {
      "id": 1,
      "difficulty": "very_easy",
      "question": "Count the money. How much is it?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png"],
      "hint": "Count one coin at a time.",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 2,
      "difficulty": "very_easy",
      "question": "Count the coins.",
      "currency_images": ["coins/₹2.png", "coins/₹1.png"],
      "hint": "₹2 plus ₹1.",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹3"
    },
    {
      "id": 3,
      "difficulty": "very_easy",
      "question": "How much money is shown?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png", "coins/₹1.png"],
      "hint": "Three ₹1 coins.",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹3"
    },
    {
      "id": 4,
      "difficulty": "easy",
      "question": "Add the coins.",
      "currency_images": ["coins/₹2.png", "coins/₹2.png"],
      "hint": "₹2 + ₹2",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹4"
    },
    {
      "id": 5,
      "difficulty": "easy",
      "question": "Count the money.",
      "currency_images": ["coins/₹5.png", "coins/₹1.png"],
      "hint": "Start from ₹5.",
      "options": ["₹5", "₹6", "₹7", "₹8"],
      "correct_answer": "₹6"
    },
    {
      "id": 6,
      "difficulty": "easy",
      "question": "How much money is there?",
      "currency_images": ["coins/₹5.png", "coins/₹2.png"],
      "hint": "₹5 plus ₹2.",
      "options": ["₹6", "₹7", "₹8", "₹9"],
      "correct_answer": "₹7"
    },
    {
      "id": 7,
      "difficulty": "easy",
      "question": "Add the coins.",
      "currency_images": ["coins/₹5.png", "coins/₹5.png"],
      "hint": "Two ₹5 coins.",
      "options": ["₹5", "₹8", "₹10", "₹15"],
      "correct_answer": "₹10"
    },
    {
      "id": 8,
      "difficulty": "easy",
      "question": "Count the money shown.",
      "currency_images": ["notes/₹10.png", "coins/₹1.png"],
      "hint": "₹10 and one more.",
      "options": ["₹10", "₹11", "₹12", "₹13"],
      "correct_answer": "₹11"
    },
    {
      "id": 9,
      "difficulty": "easy",
      "question": "How much is ₹10 + ₹2?",
      "currency_images": ["notes/₹10.png", "coins/₹2.png"],
      "hint": "Add 2 to 10.",
      "options": ["₹10", "₹11", "₹12", "₹13"],
      "correct_answer": "₹12"
    },
    {
      "id": 10,
      "difficulty": "easy",
      "question": "Count the money.",
      "currency_images": ["notes/₹10.png", "coins/₹5.png"],
      "hint": "₹10 plus ₹5.",
      "options": ["₹12", "₹15", "₹18", "₹20"],
      "correct_answer": "₹15"
    },
    {
      "id": 11,
      "difficulty": "medium",
      "question": "How much money is shown?",
      "currency_images": ["notes/₹20.png", "coins/₹5.png"],
      "hint": "Start from 20.",
      "options": ["₹20", "₹25", "₹30", "₹35"],
      "correct_answer": "₹25"
    },
    {
      "id": 12,
      "difficulty": "medium",
      "question": "Add the money.",
      "currency_images": ["notes/₹20.png", "notes/₹10.png"],
      "hint": "₹20 + ₹10",
      "options": ["₹20", "₹25", "₹30", "₹40"],
      "correct_answer": "₹30"
    },
    {
      "id": 13,
      "difficulty": "medium",
      "question": "Count all the money.",
      "currency_images": ["notes/₹20.png", "coins/₹10.png", "coins/₹5.png"],
      "hint": "20 + 10 + 5",
      "options": ["₹30", "₹35", "₹40", "₹45"],
      "correct_answer": "₹35"
    },
    {
      "id": 14,
      "difficulty": "medium",
      "question": "How much money is there?",
      "currency_images": ["notes/₹50.png", "coins/₹5.png"],
      "hint": "₹50 and ₹5.",
      "options": ["₹50", "₹55", "₹60", "₹65"],
      "correct_answer": "₹55"
    },
    {
      "id": 15,
      "difficulty": "medium",
      "question": "Add the notes.",
      "currency_images": ["notes/₹50.png", "notes/₹20.png"],
      "hint": "50 plus 20.",
      "options": ["₹60", "₹70", "₹80", "₹90"],
      "correct_answer": "₹70"
    },
    {
      "id": 16,
      "difficulty": "hard",
      "question": "Count the money carefully.",
      "currency_images": ["notes/₹50.png", "notes/₹20.png", "coins/₹5.png"],
      "hint": "50 + 20 + 5",
      "options": ["₹70", "₹75", "₹80", "₹85"],
      "correct_answer": "₹75"
    },
    {
      "id": 17,
      "difficulty": "hard",
      "question": "How much money is shown?",
      "currency_images": ["notes/₹100.png", "notes/₹10.png"],
      "hint": "Start from 100.",
      "options": ["₹105", "₹110", "₹115", "₹120"],
      "correct_answer": "₹110"
    },
    {
      "id": 18,
      "difficulty": "hard",
      "question": "Add the money.",
      "currency_images": ["notes/₹100.png", "notes/₹20.png"],
      "hint": "100 + 20",
      "options": ["₹110", "₹120", "₹130", "₹140"],
      "correct_answer": "₹120"
    },
    {
      "id": 19,
      "difficulty": "hard",
      "question": "Count all the money.",
      "currency_images": ["notes/₹100.png", "notes/₹20.png", "coins/₹5.png"],
      "hint": "100 + 20 + 5",
      "options": ["₹120", "₹125", "₹130", "₹135"],
      "correct_answer": "₹125"
    },
    {
      "id": 20,
      "difficulty": "hard",
      "question": "How much money is there?",
      "currency_images": ["notes/₹200.png", "notes/₹50.png"],
      "hint": "200 plus 50.",
      "options": ["₹230", "₹240", "₹250", "₹260"],
      "correct_answer": "₹250"
    }
  ]
};

// --- DATA: Subtraction Problems from JSON ---
const SUBTRACTION_DATA = {
  "title": "Subtraction with Indian Currency – Special Education",
  "level": "special_education",
  "total_questions": 20,
  "instructions": "Look at the money. Take away. Choose the correct amount left.",
  "problems": [
    {
      "id": 1,
      "difficulty": "very_easy",
      "question": "You have ₹2. Take away ₹1. How much is left?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png"],
      "hint": "Cross out one coin.",
      "options": ["₹0", "₹1", "₹2", "₹3"],
      "correct_answer": "₹1"
    },
    {
      "id": 2,
      "difficulty": "very_easy",
      "question": "You have ₹3. Take away ₹1.",
      "currency_images": ["coins/₹1.png", "coins/₹1.png", "coins/₹1.png"],
      "hint": "Count what is left.",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 3,
      "difficulty": "very_easy",
      "question": "You have ₹4. Take away ₹2.",
      "currency_images": ["coins/₹2.png", "coins/₹2.png"],
      "hint": "Remove one ₹2 coin.",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 4,
      "difficulty": "easy",
      "question": "You have ₹5. Take away ₹1.",
      "currency_images": ["coins/₹5.png"],
      "hint": "₹5 minus ₹1.",
      "options": ["₹3", "₹4", "₹5", "₹6"],
      "correct_answer": "₹4"
    },
    {
      "id": 5,
      "difficulty": "easy",
      "question": "You have ₹5. Take away ₹2.",
      "currency_images": ["coins/₹5.png"],
      "hint": "Count backwards.",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹3"
    },
    {
      "id": 6,
      "difficulty": "easy",
      "question": "You have ₹6. Take away ₹1.",
      "currency_images": ["coins/₹5.png", "coins/₹1.png"],
      "hint": "Remove one ₹1 coin.",
      "options": ["₹4", "₹5", "₹6", "₹7"],
      "correct_answer": "₹5"
    },
    {
      "id": 7,
      "difficulty": "easy",
      "question": "You have ₹6. Take away ₹2.",
      "currency_images": ["coins/₹5.png", "coins/₹1.png"],
      "hint": "Take away ₹2.",
      "options": ["₹3", "₹4", "₹5", "₹6"],
      "correct_answer": "₹4"
    },
    {
      "id": 8,
      "difficulty": "easy",
      "question": "You have ₹10. Take away ₹1.",
      "currency_images": ["notes/₹10.png"],
      "hint": "Count back one.",
      "options": ["₹8", "₹9", "₹10", "₹11"],
      "correct_answer": "₹9"
    },
    {
      "id": 9,
      "difficulty": "easy",
      "question": "You have ₹10. Take away ₹2.",
      "currency_images": ["notes/₹10.png"],
      "hint": "Count back two.",
      "options": ["₹7", "₹8", "₹9", "₹10"],
      "correct_answer": "₹8"
    },
    {
      "id": 10,
      "difficulty": "easy",
      "question": "You have ₹10. Take away ₹5.",
      "currency_images": ["notes/₹10.png"],
      "hint": "Half of 10.",
      "options": ["₹4", "₹5", "₹6", "₹7"],
      "correct_answer": "₹5"
    },
    {
      "id": 11,
      "difficulty": "medium",
      "question": "You have ₹20. Take away ₹5.",
      "currency_images": ["notes/₹20.png"],
      "hint": "20 minus 5.",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹15"
    },
    {
      "id": 12,
      "difficulty": "medium",
      "question": "You have ₹20. Take away ₹10.",
      "currency_images": ["notes/₹20.png"],
      "hint": "Remove ₹10.",
      "options": ["₹5", "₹10", "₹15", "₹20"],
      "correct_answer": "₹10"
    },
    {
      "id": 13,
      "difficulty": "medium",
      "question": "You have ₹25. Take away ₹5.",
      "currency_images": ["notes/₹20.png", "coins/₹5.png"],
      "hint": "Take away the ₹5 coin.",
      "options": ["₹15", "₹20", "₹25", "₹30"],
      "correct_answer": "₹20"
    },
    {
      "id": 14,
      "difficulty": "medium",
      "question": "You have ₹30. Take away ₹10.",
      "currency_images": ["notes/₹20.png", "notes/₹10.png"],
      "hint": "Remove one ₹10 note.",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹20"
    },
    {
      "id": 15,
      "difficulty": "medium",
      "question": "You have ₹50. Take away ₹20.",
      "currency_images": ["notes/₹50.png"],
      "hint": "50 minus 20.",
      "options": ["₹20", "₹30", "₹40", "₹50"],
      "correct_answer": "₹30"
    },
    {
      "id": 16,
      "difficulty": "hard",
      "question": "You have ₹50. Take away ₹25.",
      "currency_images": ["notes/₹50.png"],
      "hint": "Half of 50 is 25.",
      "options": ["₹20", "₹25", "₹30", "₹35"],
      "correct_answer": "₹25"
    },
    {
      "id": 17,
      "difficulty": "hard",
      "question": "You have ₹100. Take away ₹10.",
      "currency_images": ["notes/₹100.png"],
      "hint": "Count back ten.",
      "options": ["₹80", "₹85", "₹90", "₹95"],
      "correct_answer": "₹90"
    },
    {
      "id": 18,
      "difficulty": "hard",
      "question": "You have ₹100. Take away ₹20.",
      "currency_images": ["notes/₹100.png"],
      "hint": "100 minus 20.",
      "options": ["₹70", "₹80", "₹90", "₹100"],
      "correct_answer": "₹80"
    },
    {
      "id": 19,
      "difficulty": "hard",
      "question": "You have ₹120. Take away ₹20.",
      "currency_images": ["notes/₹100.png", "notes/₹20.png"],
      "hint": "Remove the ₹20 note.",
      "options": ["₹80", "₹90", "₹100", "₹110"],
      "correct_answer": "₹100"
    },
    {
      "id": 20,
      "difficulty": "hard",
      "question": "You have ₹200. Take away ₹50.",
      "currency_images": ["notes/₹200.png"],
      "hint": "200 minus 50.",
      "options": ["₹100", "₹125", "₹150", "₹175"],
      "correct_answer": "₹150"
    }
  ]
};

// --- DATA: Multiplication Problems from JSON ---
const MULTIPLICATION_DATA = {
  "title": "Multiplication with Indian Currency – Special Education",
  "level": "special_education",
  "total_questions": 20,
  "instructions": "Look at the groups of money. Count how many times. Choose the correct total.",
  "problems": [
    {
      "id": 1,
      "difficulty": "very_easy",
      "question": "2 groups of ₹1. How much money?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png"],
      "hint": "₹1 + ₹1",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 2,
      "difficulty": "very_easy",
      "question": "3 groups of ₹1. How much money?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png", "coins/₹1.png"],
      "hint": "Add ₹1 three times.",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹3"
    },
    {
      "id": 3,
      "difficulty": "very_easy",
      "question": "2 groups of ₹2. How much money?",
      "currency_images": ["coins/₹2.png", "coins/₹2.png"],
      "hint": "₹2 + ₹2",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹4"
    },
    {
      "id": 4,
      "difficulty": "easy",
      "question": "3 groups of ₹2. How much money?",
      "currency_images": ["coins/₹2.png", "coins/₹2.png", "coins/₹2.png"],
      "hint": "Count by 2s.",
      "options": ["₹4", "₹5", "₹6", "₹8"],
      "correct_answer": "₹6"
    },
    {
      "id": 5,
      "difficulty": "easy",
      "question": "2 groups of ₹5. How much money?",
      "currency_images": ["coins/₹5.png", "coins/₹5.png"],
      "hint": "₹5 + ₹5",
      "options": ["₹5", "₹8", "₹10", "₹15"],
      "correct_answer": "₹10"
    },
    {
      "id": 6,
      "difficulty": "easy",
      "question": "3 groups of ₹5. How much money?",
      "currency_images": ["coins/₹5.png", "coins/₹5.png", "coins/₹5.png"],
      "hint": "Add ₹5 three times.",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹15"
    },
    {
      "id": 7,
      "difficulty": "easy",
      "question": "4 groups of ₹5. How much money?",
      "currency_images": ["coins/₹5.png", "coins/₹5.png", "coins/₹5.png", "coins/₹5.png"],
      "hint": "Count by 5s.",
      "options": ["₹15", "₹20", "₹25", "₹30"],
      "correct_answer": "₹20"
    },
    {
      "id": 8,
      "difficulty": "easy",
      "question": "2 groups of ₹10. How much money?",
      "currency_images": ["notes/₹10.png", "notes/₹10.png"],
      "hint": "₹10 + ₹10",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹20"
    },
    {
      "id": 9,
      "difficulty": "easy",
      "question": "3 groups of ₹10. How much money?",
      "currency_images": ["notes/₹10.png", "notes/₹10.png", "notes/₹10.png"],
      "hint": "Add 10 three times.",
      "options": ["₹20", "₹30", "₹40", "₹50"],
      "correct_answer": "₹30"
    },
    {
      "id": 10,
      "difficulty": "easy",
      "question": "4 groups of ₹10. How much money?",
      "currency_images": ["notes/₹10.png", "notes/₹10.png", "notes/₹10.png", "notes/₹10.png"],
      "hint": "Count by 10s.",
      "options": ["₹30", "₹40", "₹50", "₹60"],
      "correct_answer": "₹40"
    },
    {
      "id": 11,
      "difficulty": "medium",
      "question": "2 groups of ₹20. How much money?",
      "currency_images": ["notes/₹20.png", "notes/₹20.png"],
      "hint": "₹20 + ₹20",
      "options": ["₹30", "₹40", "₹50", "₹60"],
      "correct_answer": "₹40"
    },
    {
      "id": 12,
      "difficulty": "medium",
      "question": "3 groups of ₹20. How much money?",
      "currency_images": ["notes/₹20.png", "notes/₹20.png", "notes/₹20.png"],
      "hint": "Add 20 three times.",
      "options": ["₹40", "₹50", "₹60", "₹80"],
      "correct_answer": "₹60"
    },
    {
      "id": 13,
      "difficulty": "medium",
      "question": "5 groups of ₹10. How much money?",
      "currency_images": ["notes/₹10.png", "notes/₹10.png", "notes/₹10.png", "notes/₹10.png", "notes/₹10.png"],
      "hint": "Count by 10s.",
      "options": ["₹40", "₹50", "₹60", "₹70"],
      "correct_answer": "₹50"
    },
    {
      "id": 14,
      "difficulty": "medium",
      "question": "2 groups of ₹50. How much money?",
      "currency_images": ["notes/₹50.png", "notes/₹50.png"],
      "hint": "₹50 + ₹50",
      "options": ["₹80", "₹90", "₹100", "₹120"],
      "correct_answer": "₹100"
    },
    {
      "id": 15,
      "difficulty": "medium",
      "question": "3 groups of ₹50. How much money?",
      "currency_images": ["notes/₹50.png", "notes/₹50.png", "notes/₹50.png"],
      "hint": "Add ₹50 three times.",
      "options": ["₹100", "₹150", "₹200", "₹250"],
      "correct_answer": "₹150"
    },
    {
      "id": 16,
      "difficulty": "hard",
      "question": "2 groups of ₹100. How much money?",
      "currency_images": ["notes/₹100.png", "notes/₹100.png"],
      "hint": "₹100 + ₹100",
      "options": ["₹150", "₹180", "₹200", "₹250"],
      "correct_answer": "₹200"
    },
    {
      "id": 17,
      "difficulty": "hard",
      "question": "3 groups of ₹100. How much money?",
      "currency_images": ["notes/₹100.png", "notes/₹100.png", "notes/₹100.png"],
      "hint": "Add 100 three times.",
      "options": ["₹200", "₹250", "₹300", "₹350"],
      "correct_answer": "₹300"
    },
    {
      "id": 18,
      "difficulty": "hard",
      "question": "4 groups of ₹50. How much money?",
      "currency_images": ["notes/₹50.png", "notes/₹50.png", "notes/₹50.png", "notes/₹50.png"],
      "hint": "Count by 50s.",
      "options": ["₹150", "₹200", "₹250", "₹300"],
      "correct_answer": "₹200"
    },
    {
      "id": 19,
      "difficulty": "hard",
      "question": "5 groups of ₹20. How much money?",
      "currency_images": ["notes/₹20.png", "notes/₹20.png", "notes/₹20.png", "notes/₹20.png", "notes/₹20.png"],
      "hint": "Add ₹20 five times.",
      "options": ["₹80", "₹90", "₹100", "₹120"],
      "correct_answer": "₹100"
    },
    {
      "id": 20,
      "difficulty": "hard",
      "question": "2 groups of ₹200. How much money?",
      "currency_images": ["notes/₹200.png", "notes/₹200.png"],
      "hint": "₹200 + ₹200",
      "options": ["₹300", "₹350", "₹400", "₹450"],
      "correct_answer": "₹400"
    }
  ]
};

// --- DATA: Division Problems from JSON ---
const DIVISION_DATA = {
  "title": "Division with Indian Currency – Special Education",
  "level": "special_education",
  "total_questions": 20,
  "instructions": "Share the money equally. Choose how much each person gets.",
  "problems": [
    {
      "id": 1,
      "difficulty": "very_easy",
      "question": "₹2 is shared between 2 people. How much does each get?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png"],
      "hint": "One coin for each person.",
      "options": ["₹0", "₹1", "₹2", "₹3"],
      "correct_answer": "₹1"
    },
    {
      "id": 2,
      "difficulty": "very_easy",
      "question": "₹4 is shared between 2 people. How much does each get?",
      "currency_images": ["coins/₹2.png", "coins/₹2.png"],
      "hint": "Split into two equal parts.",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 3,
      "difficulty": "very_easy",
      "question": "₹3 is shared between 3 people. How much does each get?",
      "currency_images": ["coins/₹1.png", "coins/₹1.png", "coins/₹1.png"],
      "hint": "Give one coin to each.",
      "options": ["₹0", "₹1", "₹2", "₹3"],
      "correct_answer": "₹1"
    },
    {
      "id": 4,
      "difficulty": "easy",
      "question": "₹6 is shared between 2 people. How much does each get?",
      "currency_images": ["coins/₹5.png", "coins/₹1.png"],
      "hint": "Half of 6.",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹3"
    },
    {
      "id": 5,
      "difficulty": "easy",
      "question": "₹6 is shared between 3 people. How much does each get?",
      "currency_images": ["coins/₹2.png", "coins/₹2.png", "coins/₹2.png"],
      "hint": "Each gets one ₹2 coin.",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 6,
      "difficulty": "easy",
      "question": "₹8 is shared between 2 people. How much does each get?",
      "currency_images": ["coins/₹5.png", "coins/₹2.png", "coins/₹1.png"],
      "hint": "Split into two equal groups.",
      "options": ["₹3", "₹4", "₹5", "₹6"],
      "correct_answer": "₹4"
    },
    {
      "id": 7,
      "difficulty": "easy",
      "question": "₹9 is shared between 3 people. How much does each get?",
      "currency_images": ["coins/₹2.png", "coins/₹2.png", "coins/₹2.png", "coins/₹2.png", "coins/₹1.png"],
      "hint": "Three equal groups.",
      "options": ["₹2", "₹3", "₹4", "₹5"],
      "correct_answer": "₹3"
    },
    {
      "id": 8,
      "difficulty": "easy",
      "question": "₹10 is shared between 2 people. How much does each get?",
      "currency_images": ["notes/₹10.png"],
      "hint": "Half of 10.",
      "options": ["₹4", "₹5", "₹6", "₹7"],
      "correct_answer": "₹5"
    },
    {
      "id": 9,
      "difficulty": "easy",
      "question": "₹10 is shared between 5 people. How much does each get?",
      "currency_images": ["notes/₹10.png"],
      "hint": "Ten shared by five.",
      "options": ["₹1", "₹2", "₹3", "₹4"],
      "correct_answer": "₹2"
    },
    {
      "id": 10,
      "difficulty": "easy",
      "question": "₹12 is shared between 3 people. How much does each get?",
      "currency_images": ["coins/₹5.png", "coins/₹5.png", "coins/₹2.png"],
      "hint": "12 divided by 3.",
      "options": ["₹3", "₹4", "₹5", "₹6"],
      "correct_answer": "₹4"
    },
    {
      "id": 11,
      "difficulty": "medium",
      "question": "₹20 is shared between 2 people. How much does each get?",
      "currency_images": ["notes/₹20.png"],
      "hint": "Half of 20.",
      "options": ["₹5", "₹10", "₹15", "₹20"],
      "correct_answer": "₹10"
    },
    {
      "id": 12,
      "difficulty": "medium",
      "question": "₹20 is shared between 4 people. How much does each get?",
      "currency_images": ["notes/₹20.png"],
      "hint": "20 ÷ 4.",
      "options": ["₹4", "₹5", "₹6", "₹7"],
      "correct_answer": "₹5"
    },
    {
      "id": 13,
      "difficulty": "medium",
      "question": "₹30 is shared between 3 people. How much does each get?",
      "currency_images": ["notes/₹20.png", "notes/₹10.png"],
      "hint": "30 divided by 3.",
      "options": ["₹5", "₹10", "₹15", "₹20"],
      "correct_answer": "₹10"
    },
    {
      "id": 14,
      "difficulty": "medium",
      "question": "₹40 is shared between 4 people. How much does each get?",
      "currency_images": ["notes/₹20.png", "notes/₹20.png"],
      "hint": "40 ÷ 4.",
      "options": ["₹5", "₹10", "₹15", "₹20"],
      "correct_answer": "₹10"
    },
    {
      "id": 15,
      "difficulty": "medium",
      "question": "₹50 is shared between 5 people. How much does each get?",
      "currency_images": ["notes/₹50.png"],
      "hint": "Share equally.",
      "options": ["₹5", "₹10", "₹15", "₹20"],
      "correct_answer": "₹10"
    },
    {
      "id": 16,
      "difficulty": "hard",
      "question": "₹60 is shared between 3 people. How much does each get?",
      "currency_images": ["notes/₹50.png", "notes/₹10.png"],
      "hint": "60 divided by 3.",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹20"
    },
    {
      "id": 17,
      "difficulty": "hard",
      "question": "₹80 is shared between 4 people. How much does each get?",
      "currency_images": ["notes/₹50.png", "notes/₹20.png", "notes/₹10.png"],
      "hint": "80 ÷ 4.",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹20"
    },
    {
      "id": 18,
      "difficulty": "hard",
      "question": "₹100 is shared between 5 people. How much does each get?",
      "currency_images": ["notes/₹100.png"],
      "hint": "100 ÷ 5.",
      "options": ["₹10", "₹15", "₹20", "₹25"],
      "correct_answer": "₹20"
    },
    {
      "id": 19,
      "difficulty": "hard",
      "question": "₹120 is shared between 6 people. How much does each get?",
      "currency_images": ["notes/₹100.png", "notes/₹20.png"],
      "hint": "120 divided by 6.",
      "options": ["₹15", "₹20", "₹25", "₹30"],
      "correct_answer": "₹20"
    },
    {
      "id": 20,
      "difficulty": "hard",
      "question": "₹200 is shared between 4 people. How much does each get?",
      "currency_images": ["notes/₹200.png"],
      "hint": "200 ÷ 4.",
      "options": ["₹40", "₹50", "₹60", "₹70"],
      "correct_answer": "₹50"
    }
  ]
};

// Helper function to extract currency type from image path
const getCurrencyType = (imagePath) => {
  const match = imagePath.match(/₹(\d+)/);
  if (!match) return 'coin-1';
  const value = match[1];
  if (imagePath.includes('notes/')) {
    return `note-${value}`;
  }
  return `coin-${value}`;
};

// --- MASCOT COMPONENT ---
const Mascot = ({ mood = 'happy', message, isAnimating = false, inCar = false, size = "md" }) => {
  const getExpression = () => {
    switch (mood) {
      case 'happy': return { eye: '●', mouth: '⌣', color: '#FBBF24', anim: isAnimating ? 'animate-bounce' : '' };
      case 'sad': return { eye: '︶', mouth: 'v', color: '#60A5FA', anim: isAnimating ? 'animate-shake' : '' };
      case 'thinking': return { eye: '●', mouth: '—', color: '#F59E0B', anim: isAnimating ? 'animate-pulse' : '' };
      default: return { eye: '●', mouth: '⌣', color: '#FBBF24', anim: '' };
    }
  };
  const exp = getExpression();
  const scale = size === "sm" ? 0.6 : 1;

  return (
    <div className="flex flex-col items-center gap-4 transition-all duration-500">
      <div className={`relative ${exp.anim}`} style={{ transform: `scale(${scale})` }}>
        {inCar && (
          <div className="absolute -bottom-10 -left-12 w-44 h-28 z-0">
            <div className="absolute bottom-4 w-full h-16 bg-gradient-to-b from-blue-500 to-blue-700 rounded-3xl border-b-[6px] border-blue-900 shadow-xl"></div>
            <div className="absolute top-0 left-10 w-24 h-18 bg-gradient-to-t from-blue-400 to-blue-300 rounded-t-[45px] border-x-4 border-t-4 border-blue-600 overflow-hidden">
               <div className="absolute top-2 left-4 w-16 h-8 bg-sky-100/40 rounded-t-[30px]"></div>
            </div>
            <div className={`absolute -bottom-1 left-6 w-12 h-12 bg-slate-900 rounded-full border-[6px] border-slate-700 flex items-center justify-center ${isAnimating ? 'animate-spin' : ''}`}>
              <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
            </div>
            <div className={`absolute -bottom-1 right-6 w-12 h-12 bg-slate-900 rounded-full border-[6px] border-slate-700 flex items-center justify-center ${isAnimating ? 'animate-spin' : ''}`}>
              <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
            </div>
            <div className="absolute bottom-10 right-2 w-5 h-5 bg-white rounded-full shadow-[0_0_20px_white]"></div>
          </div>
        )}
        <svg width="100" height="100" viewBox="0 0 120 120" className="drop-shadow-md relative z-10">
          <circle cx="60" cy="60" r="50" fill="#FBBF24" stroke="#D97706" strokeWidth="4" />
          <circle cx="60" cy="60" r="40" fill="none" stroke="#D97706" strokeWidth="2" strokeDasharray="4 4" />
          <text x="40" y="65" fontSize="24" fontWeight="bold" fill="#92400E" textAnchor="middle">{exp.eye}</text>
          <text x="80" y="65" fontSize="24" fontWeight="bold" fill="#92400E" textAnchor="middle">{exp.eye}</text>
          <text x="60" y="85" fontSize="30" fontWeight="bold" fill="#92400E" textAnchor="middle">{exp.mouth}</text>
        </svg>
      </div>
      {message && (
        <div className="bg-white border-4 border-blue-50 p-4 rounded-2xl shadow-xl max-w-[280px] relative animate-in fade-in zoom-in-50 duration-300">
          <p className="text-slate-600 font-bold text-center text-md leading-tight">{message}</p>
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-t-4 border-l-4 border-blue-50 rotate-45"></div>
        </div>
      )}
    </div>
  );
};

// --- CURRENCY UTILS ---
const CurrencyGraphic = ({ type, large = false, style = {}, onDragStart, draggable = false, id }) => {
  const isCoin = type.startsWith('coin');
  const value = type.split('-')[1];
  const colors = {
    '1': 'bg-blue-100 border-blue-300',
    '2': 'bg-pink-100 border-pink-300',
    '5': 'bg-green-100 border-green-300',
    '10': 'bg-orange-100 border-orange-300',
    '20': 'bg-yellow-100 border-yellow-300',
    '50': 'bg-cyan-100 border-cyan-300',
    '100': 'bg-purple-100 border-purple-300',
    '200': 'bg-amber-100 border-amber-300',
    '500': 'bg-stone-200 border-stone-400',
  };

  if (isCoin) {
    const size = large ? 'w-20 h-20' : 'w-16 h-16';
    return (
      <div 
        draggable={draggable}
        onDragStart={onDragStart}
        data-currency-id={id}
        style={style} 
        className={`${size} rounded-full border-4 border-yellow-600 bg-yellow-400 flex items-center justify-center shadow-md select-none ${draggable ? 'cursor-grab active:cursor-grabbing hover:scale-110 transition-transform' : ''}`}
      >
        <span className="text-yellow-900 font-bold text-lg pointer-events-none">₹{value}</span>
      </div>
    );
  }

  const w = large ? 'w-36' : 'w-32';
  const h = large ? 'h-20' : 'h-16';
  return (
    <div 
      draggable={draggable}
      onDragStart={onDragStart}
      data-currency-id={id}
      style={style} 
      className={`${w} ${h} rounded-lg border-2 ${colors[value] || 'bg-slate-100'} flex items-center justify-between px-3 shadow-sm select-none overflow-hidden ${draggable ? 'cursor-grab active:cursor-grabbing hover:scale-110 transition-transform' : ''}`}
    >
      <div className="text-slate-800 font-bold pointer-events-none">₹{value}</div>
      <div className="w-10 h-10 rounded-full border border-current opacity-5 shrink-0 pointer-events-none"></div>
    </div>
  );
};

const KNOW_CURRENCY_ITEMS = [
  { type: 'coin-1', name: 'One Rupee Coin', val: 1 },
  { type: 'coin-2', name: 'Two Rupee Coin', val: 2 },
  { type: 'coin-5', name: 'Five Rupee Coin', val: 5 },
  { type: 'coin-10', name: 'Ten Rupee Coin', val: 10 },
  { type: 'coin-20', name: 'Twenty Rupee Coin', val: 20 },
  { type: 'note-10', name: 'Ten Rupee Note', val: 10 },
  { type: 'note-20', name: 'Twenty Rupee Note', val: 20 },
  { type: 'note-50', name: 'Fifty Rupee Note', val: 50 },
  { type: 'note-100', name: 'One Hundred Rupee Note', val: 100 },
  { type: 'note-200', name: 'Two Hundred Rupee Note', val: 200 },
  { type: 'note-500', name: 'Five Hundred Rupee Note', val: 500 },
];

// Available currency for word problems
const AVAILABLE_CURRENCY = [
  { type: 'coin-1', val: 1 },
  { type: 'coin-2', val: 2 },
  { type: 'coin-5', val: 5 },
  { type: 'note-10', val: 10 },
  { type: 'note-20', val: 20 },
  { type: 'note-50', val: 50 },
  { type: 'note-100', val: 100 },
];

const COMFORTING_WORDS = [
  "Take a little breath. We can try again together.",
  "Coiny is right here with you. No rush at all.",
  "It's okay to take your time. Let's look once more.",
  "Soft hearts and slow tries. You are doing so well.",
  "You are safe, and you are learning. Let's try again.",
  "Let's look at the colors together, nice and easy."
];

const SUCCESS_WORDS = [
  "Yay! That is perfect!",
  "Great job! You found the right jar.",
  "Coiny is so happy with your work!",
  "Excellent! You are a rupee expert.",
  "Fantastic! Let's try another one."
];

const JAR_COLORS = {
  1: 'bg-blue-100 border-blue-400 text-blue-700',
  2: 'bg-pink-100 border-pink-400 text-pink-700',
  5: 'bg-green-100 border-green-400 text-green-700',
  10: 'bg-orange-100 border-orange-400 text-orange-700',
  20: 'bg-yellow-100 border-yellow-400 text-yellow-700',
  50: 'bg-cyan-100 border-cyan-400 text-cyan-700',
  100: 'bg-purple-100 border-purple-400 text-purple-700',
  200: 'bg-amber-100 border-amber-400 text-amber-700',
  500: 'bg-stone-100 border-stone-400 text-stone-700',
};

const MODULES = [
  { id: 'know-your-currency', name: 'Know Your Currency', icon: <BookOpen />, color: 'bg-indigo-500' },
  { id: 'addition', name: 'Addition', icon: <span className="text-2xl font-bold">+</span>, color: 'bg-blue-500' },
  { id: 'subtraction', name: 'Subtraction', icon: <span className="text-2xl font-bold">-</span>, color: 'bg-rose-500' },
  { id: 'multiplication', name: 'Multiplication', icon: <span className="text-2xl font-bold">×</span>, color: 'bg-emerald-500' },
  { id: 'division', name: 'Division', icon: <span className="text-2xl font-bold">÷</span>, color: 'bg-purple-500' },
  { id: 'word-problems', name: 'Shopping Game', icon: <ShoppingBag />, color: 'bg-amber-500' },
];

export default function App() {
  const [view, setView] = useState('auth'); 
  const [user, setUser] = useState(null);
  const [unlockedModules, setUnlockedModules] = useState(['know-your-currency', 'addition']);
  const [progress, setProgress] = useState({ 'addition': 0, 'know-your-currency': 0, 'subtraction': 0, 'multiplication': 0, 'division': 0, 'word-problems': 0 });
  const [activeModule, setActiveModule] = useState(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [feedback, setFeedback] = useState(null); 
  const [showHint, setShowHint] = useState(false);
  const [isCoinyAnimating, setIsCoinyAnimating] = useState(false);
  
  const [knowCurrencyTab, setKnowCurrencyTab] = useState('library'); 
  
  const [dragItem, setDragItem] = useState(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [gameLevel, setGameLevel] = useState(0);
  const [gameItems, setGameItems] = useState(() => [...KNOW_CURRENCY_ITEMS].sort(() => Math.random() - 0.5));
  
  // Math levels state - separate for each module
  const [additionHighest, setAdditionHighest] = useState(1);
  const [additionCompleted, setAdditionCompleted] = useState(new Set([0]));
  const [subtractionHighest, setSubtractionHighest] = useState(1);
  const [subtractionCompleted, setSubtractionCompleted] = useState(new Set([0]));
  const [multiplicationHighest, setMultiplicationHighest] = useState(1);
  const [multiplicationCompleted, setMultiplicationCompleted] = useState(new Set([0]));
  const [divisionHighest, setDivisionHighest] = useState(1);
  const [divisionCompleted, setDivisionCompleted] = useState(new Set([0]));
  const [wordProblemsHighest, setWordProblemsHighest] = useState(1);
  const [wordProblemsCompleted, setWordProblemsCompleted] = useState(new Set([0]));
  
  // Word problems state for wallet interaction
  const [walletCurrency, setWalletCurrency] = useState([]);
  const [walletTotal, setWalletTotal] = useState(0);
  const [wordProblemFeedback, setWordProblemFeedback] = useState(null);
  
  const [quizState, setQuizState] = useState({ active: false, currentQuestion: null });
  const [showVictory, setShowVictory] = useState(false);
  const [hintActive, setHintActive] = useState(false);
  
  const jarRefs = useRef({});
  const walletRef = useRef(null);

  const handleAuth = (e) => {
    e.preventDefault();
    setUser({ name: e.target.name.value || 'Friend', hearts: 5 });
    setView('dashboard');
  };

  const startModule = (mod) => {
    setActiveModule(mod);
    if (mod.id === 'know-your-currency') setView('know-currency');
    else if (mod.id === 'addition') setView('addition-map');
    else if (mod.id === 'subtraction') setView('subtraction-map');
    else if (mod.id === 'multiplication') setView('multiplication-map');
    else if (mod.id === 'division') setView('division-map');
    else if (mod.id === 'word-problems') setView('word-problems-map');
    else setView('quiz');
  };

  const handleDragStart = (e, item) => {
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    setDragItem(item);
    setDragPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleDragMove = (e) => {
    if (!dragItem) return;
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    setDragPos({ x: touch.clientX, y: touch.clientY });
  };

  const handleDragEnd = (e) => {
    if (!dragItem) return;
    
    const targetJar = jarRefs.current[dragItem.val];
    if (targetJar) {
      const rect = targetJar.getBoundingClientRect();
      if (
        dragPos.x > rect.left && dragPos.x < rect.right &&
        dragPos.y > rect.top && dragPos.y < rect.bottom
      ) {
        const msg = SUCCESS_WORDS[Math.floor(Math.random() * SUCCESS_WORDS.length)];
        setFeedback({ type: 'success', message: msg });
        setIsCoinyAnimating(true);
        setTimeout(() => {
          setGameLevel(prev => prev + 1);
          setFeedback(null);
          setIsCoinyAnimating(false);
        }, 1500);
      } else {
        const msg = COMFORTING_WORDS[Math.floor(Math.random() * COMFORTING_WORDS.length)];
        setFeedback({ type: 'error', message: msg });
        setIsCoinyAnimating(true);
        setTimeout(() => { 
          setFeedback(null); 
          setIsCoinyAnimating(false); 
        }, 2500);
      }
    }
    setDragItem(null);
  };

  // Word problem currency drag handlers
  const handleCurrencyDragStart = (e, currency) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('currency', JSON.stringify(currency));
  };

  const handleWalletDrop = (e) => {
    e.preventDefault();
    const currencyData = JSON.parse(e.dataTransfer.getData('currency'));
    const newId = Date.now() + Math.random();
    setWalletCurrency(prev => [...prev, { ...currencyData, id: newId }]);
    setWalletTotal(prev => prev + currencyData.val);
  };

  const handleWalletDragOver = (e) => {
    e.preventDefault();
  };

  const removeCurrencyFromWallet = (id, value) => {
    setWalletCurrency(prev => prev.filter(c => c.id !== id));
    setWalletTotal(prev => prev - value);
  };

  const resetWallet = () => {
    setWalletCurrency([]);
    setWalletTotal(0);
    setWordProblemFeedback(null);
  };

  const submitWordProblem = () => {
    const problem = quizState.currentQuestion;
    if (walletTotal === problem.price) {
      setWordProblemFeedback({ type: 'success', message: 'Perfect! You paid the exact amount!' });
      handleSolveLevel(problem.id, problem.price, 'word-problems');
    } else if (walletTotal < problem.price) {
      setWordProblemFeedback({ type: 'error', message: `You need ₹${problem.price - walletTotal} more!` });
      setTimeout(() => setWordProblemFeedback(null), 2000);
    } else {
      setWordProblemFeedback({ type: 'error', message: `That's ₹${walletTotal - problem.price} too much!` });
      setTimeout(() => setWordProblemFeedback(null), 2000);
    }
  };

  const getLevelPos = (idx) => {
    const x = 50 + Math.sin(idx * 0.8) * 35; 
    const y = 90 - (idx * 4.5); 
    return { x, y };
  };

  // Special position calculation for word problems (only 5 levels)
  const getWordProblemLevelPos = (idx) => {
    const x = 50 + Math.sin(idx * 1.5) * 35;
    const y = 90 - (idx * 18); // Larger spacing for 5 levels
    return { x, y };
  };

  // Generate road path connecting all levels with smooth curves
  const generateRoadPath = () => {
    let data;
    let isWordProblems = false;
    
    if (view === 'subtraction-map') data = SUBTRACTION_DATA;
    else if (view === 'multiplication-map') data = MULTIPLICATION_DATA;
    else if (view === 'division-map') data = DIVISION_DATA;
    else if (view === 'word-problems-map') {
      data = WORD_PROBLEMS_DATA;
      isWordProblems = true;
    }
    else data = ADDITION_DATA;
    
    const points = data.problems.map((_, i) => 
      isWordProblems ? getWordProblemLevelPos(i) : getLevelPos(i)
    );
    
    if (points.length === 0) return '';
    
    let pathData = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length; i++) {
      const prevPoint = points[i - 1];
      const currPoint = points[i];
      
      const dx = currPoint.x - prevPoint.x;
      const dy = currPoint.y - prevPoint.y;
      
      const controlX = prevPoint.x + dx * 0.5;
      const controlY = prevPoint.y + dy * 0.5;
      
      pathData += ` Q ${controlX} ${controlY}, ${currPoint.x} ${currPoint.y}`;
    }
    
    return pathData;
  };

  // Handle level click
  const handleLevelClick = (levelId, moduleType) => {
    let data;
    if (moduleType === 'subtraction') data = SUBTRACTION_DATA;
    else if (moduleType === 'multiplication') data = MULTIPLICATION_DATA;
    else if (moduleType === 'division') data = DIVISION_DATA;
    else if (moduleType === 'word-problems') data = WORD_PROBLEMS_DATA;
    else data = ADDITION_DATA;
    
    const problem = data.problems.find(p => p.id === levelId);
    if (problem) {
      if (moduleType === 'word-problems') {
        // For word problems, reset wallet and show the problem
        setWalletCurrency([]);
        setWalletTotal(0);
        setWordProblemFeedback(null);
      }
      setQuizState({ active: true, currentQuestion: problem, moduleType });
      setHintActive(false);
    }
  };

  const handleSolveLevel = (levelId, answer, moduleType) => {
    let data;
    if (moduleType === 'subtraction') data = SUBTRACTION_DATA;
    else if (moduleType === 'multiplication') data = MULTIPLICATION_DATA;
    else if (moduleType === 'division') data = DIVISION_DATA;
    else if (moduleType === 'word-problems') data = WORD_PROBLEMS_DATA;
    else data = ADDITION_DATA;
    
    const problem = data.problems.find(p => p.id === levelId);
    
    // For word problems, check if wallet total matches price
    const isCorrect = moduleType === 'word-problems' 
      ? answer === problem.price 
      : answer === problem.correct_answer;
    
    if (isCorrect) {
      setFeedback({ type: 'success', message: "Perfect!" });
      
      if (moduleType === 'word-problems') {
        setWordProblemsCompleted(prev => new Set([...prev, levelId]));
        if (levelId >= wordProblemsHighest) {
          setWordProblemsHighest(levelId + 1);
        }
      } else if (moduleType === 'division') {
        setDivisionCompleted(prev => new Set([...prev, levelId]));
        if (levelId >= divisionHighest) {
          setDivisionHighest(levelId + 1);
        }
      } else if (moduleType === 'multiplication') {
        setMultiplicationCompleted(prev => new Set([...prev, levelId]));
        if (levelId >= multiplicationHighest) {
          setMultiplicationHighest(levelId + 1);
        }
      } else if (moduleType === 'subtraction') {
        setSubtractionCompleted(prev => new Set([...prev, levelId]));
        if (levelId >= subtractionHighest) {
          setSubtractionHighest(levelId + 1);
        }
      } else {
        setAdditionCompleted(prev => new Set([...prev, levelId]));
        if (levelId >= additionHighest) {
          setAdditionHighest(levelId + 1);
        }
      }
      
      setTimeout(() => {
        setQuizState({ active: false, currentQuestion: null, moduleType: null });
        setFeedback(null);
        
        const maxLevel = moduleType === 'word-problems' ? 5 : 20;
        if (levelId === maxLevel) {
          setShowVictory(true);
          if (moduleType === 'addition') {
            setUnlockedModules(prev => [...new Set([...prev, 'subtraction'])]);
          } else if (moduleType === 'subtraction') {
            setUnlockedModules(prev => [...new Set([...prev, 'multiplication'])]);
          } else if (moduleType === 'multiplication') {
            setUnlockedModules(prev => [...new Set([...prev, 'division'])]);
          } else if (moduleType === 'division') {
            setUnlockedModules(prev => [...new Set([...prev, 'word-problems'])]);
          }
        }
      }, 1000);
    } else {
      setFeedback({ type: 'error', message: "Not quite, try again!" });
      setTimeout(() => setFeedback(null), 1500);
    }
  };

  // Math Map Component (reusable for all math modules including word problems)
  const MathMapView = ({ moduleType, data, highestLevel, completedLevels }) => {
    const isWordProblems = moduleType === 'word-problems';
    const mapHeight = isWordProblems ? 'h-[400px]' : 'h-[1500px]';
    
    return (
    <div className="min-h-screen bg-sky-100 relative overflow-hidden flex flex-col">
       <header className="p-4 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
          <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={32} /></button>
          <h2 className="font-black text-slate-700 uppercase tracking-widest text-sm">
            {moduleType === 'word-problems' ? 'Shopping Game' : moduleType === 'division' ? 'Division' : moduleType === 'multiplication' ? 'Multiplication' : moduleType === 'subtraction' ? 'Subtraction' : 'Addition'} Levels
          </h2>
          <div className="w-10"></div>
       </header>

       <div className="flex-1 overflow-y-auto relative p-10 bg-gradient-to-b from-green-50 to-sky-100">
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/grass.png")', opacity: 0.3 }}></div>

          <div className={`relative w-full ${mapHeight}`}>
             <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#94a3b8', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#64748b', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path 
                  d={generateRoadPath()} 
                  fill="none" 
                  stroke="url(#roadGradient)" 
                  strokeWidth="1.8" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="drop-shadow-lg"
                  vectorEffect="non-scaling-stroke"
                />
                <path 
                  d={generateRoadPath()} 
                  fill="none" 
                  stroke="#ffffff" 
                  strokeWidth="0.3" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  strokeDasharray="1 1"
                  className="opacity-70"
                  vectorEffect="non-scaling-stroke"
                />
             </svg>

             {data.problems.map((problem, i) => {
                const { x, y } = isWordProblems ? getWordProblemLevelPos(i) : getLevelPos(i);
                const isCompleted = completedLevels.has(problem.id);
                const isAccessible = problem.id <= highestLevel;
                const isCurrent = problem.id === highestLevel && !isCompleted;
                
                return (
                  <div key={problem.id} style={{ left: `${x}%`, top: `${y}%`, zIndex: 10 }} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <button 
                        onClick={() => isAccessible && !showVictory && handleLevelClick(problem.id, moduleType)}
                        disabled={!isAccessible}
                        className={`w-16 h-16 rounded-full border-b-8 flex items-center justify-center font-black text-xl transition-all active:scale-90 relative shadow-lg
                          ${isCompleted ? 'bg-emerald-400 border-emerald-600 text-white' : 
                            isCurrent ? 'bg-yellow-400 border-yellow-600 z-10 animate-pulse' : 
                            isAccessible ? 'bg-white border-slate-300 text-slate-700 hover:scale-110' : 'bg-slate-300 border-slate-400 text-slate-400 cursor-not-allowed'}
                        `}
                      >
                         {problem.id}
                         {isCompleted && (
                           <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-md">
                             <CheckCircle2 size={16} className="text-white" />
                           </div>
                         )}
                      </button>
                  </div>
                );
             })}

             {!showVictory && (
               <div 
                 style={{ 
                   left: `${(isWordProblems ? getWordProblemLevelPos(Math.min(highestLevel - 1, data.problems.length - 1)) : getLevelPos(Math.min(highestLevel - 1, 19))).x}%`, 
                   top: `${(isWordProblems ? getWordProblemLevelPos(Math.min(highestLevel - 1, data.problems.length - 1)) : getLevelPos(Math.min(highestLevel - 1, 19))).y}%`,
                   zIndex: 20
                 }} 
                 className="absolute -translate-x-1/2 -translate-y-[80%] pointer-events-none"
               >
                  <Mascot inCar size="sm" />
               </div>
             )}
          </div>
       </div>

       {quizState.active && quizState.currentQuestion && quizState.moduleType === moduleType && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[48px] p-8 shadow-2xl border-b-[16px] border-slate-200 overflow-y-auto max-h-[90vh] relative">
               <button onClick={() => setQuizState({ active: false, currentQuestion: null, moduleType: null })} className="absolute top-8 right-8 text-slate-300 hover:text-slate-500 transition-colors z-10"><LogOut /></button>
               
               {/* Word Problems Quiz Content */}
               {moduleType === 'word-problems' ? (
                 <div className="flex flex-col gap-6">
                   <div className="flex flex-col items-center">
                     <Mascot 
                       mood={wordProblemFeedback?.type === 'error' ? 'thinking' : 'happy'} 
                       isAnimating={!!wordProblemFeedback} 
                       message={quizState.currentQuestion.question} 
                     />
                   </div>

                   <div className="grid md:grid-cols-2 gap-6">
                     {/* Left: Item to buy */}
                     <div className="bg-gradient-to-b from-blue-50 to-white rounded-3xl p-6 flex flex-col items-center gap-4 border-2 border-blue-100">
                       <h3 className="text-lg font-black text-slate-700 uppercase">Item</h3>
                       <ShoppingItemIcon type={quizState.currentQuestion.item} size="lg" />
                       <div className="text-center">
                         <p className="text-lg font-black text-slate-600">{quizState.currentQuestion.itemName}</p>
                         <p className="text-3xl font-black text-emerald-600 mt-2">₹{quizState.currentQuestion.price}</p>
                       </div>
                     </div>

                     {/* Right: Wallet */}
                     <div className="flex flex-col gap-4">
                       <div 
                         ref={walletRef}
                         onDrop={handleWalletDrop}
                         onDragOver={handleWalletDragOver}
                         className="bg-gradient-to-b from-purple-50 to-white rounded-3xl p-4 border-2 border-purple-100 min-h-[200px] flex flex-col"
                       >
                         <div className="flex items-center justify-between mb-3">
                           <div className="flex items-center gap-2">
                             <Wallet size={20} className="text-blue-600" />
                             <h3 className="text-sm font-black text-slate-700">Wallet</h3>
                           </div>
                           <button 
                             onClick={resetWallet}
                             className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-600 rounded-xl font-black text-xs hover:bg-red-200 transition-all active:scale-95"
                           >
                             <RotateCcw size={12} /> Reset
                           </button>
                         </div>

                         <div className="flex-1 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl border-2 border-dashed border-blue-200 p-2 flex flex-wrap gap-2 content-start min-h-[100px]">
                           {walletCurrency.length === 0 ? (
                             <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-xs">
                               Drag money here
                             </div>
                           ) : (
                             walletCurrency.map((currency) => (
                               <div key={currency.id} className="relative group">
                                 <CurrencyGraphic type={currency.type} />
                                 <button
                                   onClick={() => removeCurrencyFromWallet(currency.id, currency.val)}
                                   className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                 >
                                   <Trash2 size={10} />
                                 </button>
                               </div>
                             ))
                           )}
                         </div>

                         <div className="mt-3 pt-3 border-t-2 border-slate-100 flex items-center justify-between">
                           <span className="text-sm font-black text-slate-600">Total:</span>
                           <span className={`text-2xl font-black ${walletTotal === quizState.currentQuestion.price ? 'text-emerald-600' : walletTotal > quizState.currentQuestion.price ? 'text-red-600' : 'text-blue-600'}`}>
                             ₹{walletTotal}
                           </span>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* Available Currency */}
                   <div className="bg-white rounded-2xl p-4 border-2 border-slate-100">
                     <h3 className="text-sm font-black text-slate-700 mb-3 text-center">Available Money</h3>
                     <div className="flex flex-wrap gap-3 justify-center">
                       {AVAILABLE_CURRENCY.map((currency, idx) => (
                         <CurrencyGraphic 
                           key={idx}
                           type={currency.type}
                           draggable
                           onDragStart={(e) => handleCurrencyDragStart(e, currency)}
                         />
                       ))}
                     </div>
                   </div>

                   {/* Feedback and Submit */}
                   <div className="flex flex-col gap-3">
                     {wordProblemFeedback && (
                       <div className={`p-3 rounded-2xl font-black text-center ${wordProblemFeedback.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                         {wordProblemFeedback.message}
                       </div>
                     )}
                     <button 
                       onClick={submitWordProblem}
                       disabled={walletTotal === 0}
                       className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl text-lg shadow-[0_6px_0_rgb(5,150,105)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                       Pay Now
                     </button>
                   </div>
                 </div>
               ) : (
                 /* Regular Math Quiz Content */
                 <>
                   <div className="flex justify-between items-start mb-6">
                      <Mascot 
                        mood={feedback?.type === 'error' ? 'thinking' : 'happy'} 
                        isAnimating={!!feedback} 
                        message={hintActive && quizState.currentQuestion.hint ? quizState.currentQuestion.hint : quizState.currentQuestion.question} 
                      />
                      {quizState.currentQuestion.hint && (
                        <button 
                          onClick={() => setHintActive(true)}
                          className="flex flex-col items-center gap-1 group"
                        >
                          <div className="w-14 h-14 bg-amber-100 text-amber-500 rounded-2xl flex items-center justify-center shadow-sm group-active:scale-90 transition-all border-b-4 border-amber-200">
                            <Lightbulb />
                          </div>
                          <span className="text-[10px] font-black text-amber-600 uppercase">Hint</span>
                        </button>
                      )}
                   </div>
                   
                   <div className="mt-10 flex flex-col items-center gap-8">
                      <div className="flex items-center gap-4 flex-wrap justify-center">
                        {quizState.currentQuestion.currency_images.map((img, idx) => (
                          <CurrencyGraphic key={idx} type={getCurrencyType(img)} large />
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full">
                        {quizState.currentQuestion.options.map((opt, idx) => (
                          <button key={idx} onClick={() => handleSolveLevel(quizState.currentQuestion.id, opt, moduleType)}
                            className="bg-slate-50 hover:bg-blue-600 hover:text-white py-6 rounded-3xl font-black text-3xl transition-all active:scale-95 border-b-8 border-slate-200 hover:border-blue-800">
                            {opt}
                          </button>
                        ))}
                      </div>

                      {feedback && (
                        <div className={`text-2xl font-black ${feedback.type === 'success' ? 'text-emerald-500' : 'text-rose-500'} animate-bounce`}>
                          {feedback.message}
                        </div>
                      )}
                   </div>
                 </>
               )}
            </div>
         </div>
       )}

       {showVictory && (
         <div className="fixed inset-0 bg-emerald-500/90 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-8 text-center">
            <div className="bg-white rounded-[40px] p-10 shadow-2xl border-b-[12px] border-slate-200 flex flex-col items-center gap-6 animate-in zoom-in-50 duration-500">
               <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-500 animate-bounce">
                  <PartyPopper size={64} />
               </div>
               <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter">
                 {moduleType === 'word-problems' ? 'Shopping' : moduleType === 'division' ? 'Division' : moduleType === 'multiplication' ? 'Multiplication' : moduleType === 'subtraction' ? 'Subtraction' : 'Addition'} Master!
               </h1>
               <Mascot mood="happy" message={
                 moduleType === 'word-problems' 
                   ? "You finished Shopping! You're a Rupee Master!" 
                   : moduleType === 'division' 
                   ? "You finished Division! Shopping Game is unlocked!" 
                   : moduleType === 'multiplication' 
                   ? "You finished Multiplication! Division is unlocked!" 
                   : moduleType === 'subtraction' 
                   ? "You finished Subtraction! Multiplication is unlocked!" 
                   : "You finished Addition! Subtraction is unlocked!"
               } />
               <p className="text-slate-500 font-bold max-w-xs">
                 You are truly a Rupee Master. Coiny is so proud of your progress.
               </p>
               <button 
                 onClick={() => {
                   setShowVictory(false);
                   setView('dashboard');
                 }} 
                 className="mt-4 bg-emerald-500 text-white font-black px-12 py-5 rounded-3xl text-xl shadow-[0_8px_0_rgb(5,150,105)] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest"
               >
                 Go to Town
               </button>
            </div>
         </div>
       )}
    </div>
  );};

  // --- RENDERS ---

  if (view === 'auth') return (
    <div className="min-h-screen bg-blue-500 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl p-10 w-full max-w-md text-center border-b-[10px] border-slate-200">
        <Mascot mood="happy" message="Hi! I'm Coiny. Let's learn about money!" isAnimating={true} />
        <form onSubmit={handleAuth} className="mt-8 space-y-4">
          <input name="name" type="text" placeholder="Your Name" required className="w-full px-6 py-4 rounded-2xl bg-slate-100 border-2 border-transparent focus:border-blue-400 focus:outline-none font-bold text-lg" />
          <button type="submit" className="w-full bg-emerald-500 text-white font-black py-4 rounded-2xl shadow-[0_6px_0_rgb(5,150,105)] transition-all text-xl uppercase tracking-widest">Start Game</button>
        </form>
      </div>
    </div>
  );

  if (view === 'dashboard') return (
    <div className="min-h-screen bg-slate-50">
      <header className="p-6 bg-white shadow-sm flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-700 uppercase tracking-tighter">Rupee Master</h2>
        <div className="flex items-center gap-2 bg-rose-100 text-rose-600 px-4 py-2 rounded-full font-black"><Heart size={20} className="fill-rose-500" /> 5</div>
      </header>
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border-2 border-slate-100 flex items-center gap-6">
           <Mascot mood="happy" />
           <div className="flex-1"><h3 className="text-xl font-black text-slate-800">Hi {user?.name}!</h3><p className="text-slate-500 font-bold">What shall we learn today?</p></div>
        </div>
        <div className="grid gap-4">
          {MODULES.map(mod => {
            const unlocked = unlockedModules.includes(mod.id);
            return (
              <button key={mod.id} disabled={!unlocked} onClick={() => startModule(mod)}
                className={`p-6 rounded-3xl border-b-8 flex items-center gap-6 ${unlocked ? `bg-white border-slate-200 shadow-sm transition-all active:scale-95` : 'bg-slate-100 opacity-60'}`}>
                <div className={`w-14 h-14 rounded-2xl ${mod.color} text-white flex items-center justify-center shadow-md`}>{mod.icon}</div>
                <div className="text-left flex-1 font-black text-slate-700 text-lg">{mod.name}</div>
                {!unlocked ? <Lock className="text-slate-300" /> : <ChevronRight className="text-slate-300" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  if (view === 'addition-map') return <MathMapView moduleType="addition" data={ADDITION_DATA} highestLevel={additionHighest} completedLevels={additionCompleted} />;
  
  if (view === 'subtraction-map') return <MathMapView moduleType="subtraction" data={SUBTRACTION_DATA} highestLevel={subtractionHighest} completedLevels={subtractionCompleted} />;
  
  if (view === 'multiplication-map') return <MathMapView moduleType="multiplication" data={MULTIPLICATION_DATA} highestLevel={multiplicationHighest} completedLevels={multiplicationCompleted} />;

  if (view === 'division-map') return <MathMapView moduleType="division" data={DIVISION_DATA} highestLevel={divisionHighest} completedLevels={divisionCompleted} />;

  if (view === 'word-problems-map') return <MathMapView moduleType="word-problems" data={WORD_PROBLEMS_DATA} highestLevel={wordProblemsHighest} completedLevels={wordProblemsCompleted} />;

  if (view === 'know-currency') return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-hidden" 
         onMouseMove={handleDragMove} onTouchMove={handleDragMove} 
         onMouseUp={handleDragEnd} onTouchEnd={handleDragEnd}>
      
      <header className="p-4 flex items-center gap-4 bg-white border-b sticky top-0 z-50">
        <button onClick={() => setView('dashboard')} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={32} /></button>
        <div className="flex-1 flex justify-center bg-slate-100 rounded-full p-1 max-w-xs mx-auto border-2 border-slate-200">
          <button onClick={() => setKnowCurrencyTab('library')} className={`flex-1 py-2 px-4 rounded-full font-black text-xs transition-all flex items-center justify-center gap-2 ${knowCurrencyTab === 'library' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><BookOpen size={16}/> LIBRARY</button>
          <button onClick={() => setKnowCurrencyTab('identification')} className={`flex-1 py-2 px-4 rounded-full font-black text-xs transition-all flex items-center justify-center gap-2 ${knowCurrencyTab === 'identification' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Gamepad2 size={16}/> IDENTIFY</button>
        </div>
        <div className="w-10"></div>
      </header>

      {knowCurrencyTab === 'library' ? (
        <main className="flex-1 p-6 max-w-3xl mx-auto w-full overflow-y-auto">
          <div className="flex flex-col items-center mb-10">
            <Mascot mood="happy" isAnimating={isCoinyAnimating} message="Tap any money to hear Coiny speak!" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pb-20">
            {KNOW_CURRENCY_ITEMS.map(item => (
              <button key={item.type} onClick={() => { speak(item.name); setIsCoinyAnimating(true); setTimeout(()=>setIsCoinyAnimating(false),1500); }} 
                className="bg-white border-2 border-slate-100 rounded-[32px] p-6 flex flex-col items-center shadow-sm hover:border-indigo-400 transition-all active:scale-95 group">
                <CurrencyGraphic type={item.type} large />
                <span className="mt-4 font-black text-slate-700 group-hover:text-indigo-600 text-center text-sm">{item.name}</span>
                <Volume2 size={24} className="mt-2 text-indigo-200 group-hover:text-indigo-400" />
              </button>
            ))}
          </div>
        </main>
      ) : (
        <main className="flex-1 flex flex-col p-6 items-center select-none relative pb-32">
          <Mascot mood={feedback?.type === 'error' ? 'thinking' : 'happy'} isAnimating={isCoinyAnimating} message={feedback?.message || "Can you put this item in the right jar?"} />
          
          <div className="w-full max-w-5xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
            {Object.keys(JAR_COLORS).map(val => (
              <div key={val} ref={el => jarRefs.current[val] = el}
                className={`relative ${JAR_COLORS[val]} border-4 rounded-[32px] h-32 flex flex-col items-center justify-center shadow-md transition-all`}>
                <div className="font-black text-2xl drop-shadow-sm">₹{val}</div>
                <div className="absolute bottom-2 text-[10px] font-bold opacity-60 uppercase">Jar</div>
              </div>
            ))}
          </div>

          <div className="mt-auto h-48 w-full flex items-center justify-center bg-white bg-opacity-40 rounded-[40px] border-4 border-dashed border-slate-200">
            {!feedback && (
              <div 
                onMouseDown={(e) => handleDragStart(e, gameItems[gameLevel % gameItems.length])}
                onTouchStart={(e) => handleDragStart(e, gameItems[gameLevel % gameItems.length])}
                className="cursor-grab active:cursor-grabbing hover:scale-110 transition-transform active:scale-95"
              >
                <CurrencyGraphic type={gameItems[gameLevel % gameItems.length].type} large />
              </div>
            )}
            {feedback && (
              <div className="flex flex-col items-center gap-2 animate-bounce">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                   <Sparkles size={32} />
                </div>
              </div>
            )}
          </div>

          {dragItem && (
            <div className="fixed pointer-events-none z-[100] transform -translate-x-1/2 -translate-y-1/2 shadow-2xl scale-110 opacity-90"
                 style={{ left: dragPos.x, top: dragPos.y }}>
              <CurrencyGraphic type={dragItem.type} large />
            </div>
          )}
        </main>
      )}
    </div>
  );

  if (view === 'quiz') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
      <Mascot mood="happy" message="Let's head back and try the Identify game!" />
      <button onClick={() => setView('dashboard')} className="mt-10 bg-blue-500 text-white font-black px-10 py-5 rounded-3xl text-xl shadow-lg">BACK TO TOWN</button>
    </div>
  );

  return null;
}

const style = document.createElement('style');
style.textContent = `
  @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
  .animate-shake { animation: shake 0.4s ease-in-out infinite; }
  .cursor-grab { cursor: grab; }
  .cursor-grabbing { cursor: grabbing; }
  @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  .animate-bounce { animation: bounce 1s infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .animate-spin { animation: spin 0.3s linear infinite; }
`;
document.head.appendChild(style);