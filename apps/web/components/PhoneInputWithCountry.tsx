'use client';

import React, { useState } from 'react';
import { COUNTRIES, Country } from '../lib/countries';
import { ChevronDown, Phone } from 'lucide-react';

interface PhoneInputProps {
  value: string; // E.164 formatted number (e.g. +91 9876543210)
  onChange: (fullNumber: string) => void;
  defaultCountryCode?: string;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

export default function PhoneInputWithCountry({
  value,
  onChange,
  defaultCountryCode = 'IN',
  placeholder = '98765 43210',
  className = '',
  required = false,
}: PhoneInputProps) {
  // Find initial country
  const initialCountry = COUNTRIES.find((c) => value.startsWith(c.dialCode)) ||
    COUNTRIES.find((c) => c.code === defaultCountryCode) ||
    COUNTRIES[0];

  const [selectedCountry, setSelectedCountry] = useState<Country>(initialCountry);
  const [phoneNumber, setPhoneNumber] = useState<string>(() => {
    if (!value) return '';
    if (value.startsWith(selectedCountry.dialCode)) {
      return value.slice(selectedCountry.dialCode.length).trim();
    }
    return value;
  });

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = COUNTRIES.find((c) => c.code === e.target.value) || COUNTRIES[0];
    setSelectedCountry(country);
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    onChange(cleaned ? `${country.dialCode} ${cleaned}` : '');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setPhoneNumber(raw);
    const cleaned = raw.replace(/[^0-9]/g, '');
    onChange(cleaned ? `${selectedCountry.dialCode} ${cleaned}` : '');
  };

  return (
    <div className={`flex rounded-xl bg-slate-950/70 border border-slate-800 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all ${className}`}>
      {/* Country Flag & Dial Code Select */}
      <div className="relative flex items-center border-r border-slate-800 bg-slate-900/60 rounded-l-xl px-2.5 py-2">
        <span className="text-base mr-1.5">{selectedCountry.flag}</span>
        <span className="text-xs font-semibold text-slate-300 mr-1">{selectedCountry.dialCode}</span>
        <ChevronDown className="w-3 h-3 text-slate-500 pointer-events-none" />
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Select Country Code"
        >
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-slate-900 text-white">
              {c.flag} {c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* Number Input */}
      <input
        type="tel"
        required={required}
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        className="flex-1 px-3.5 py-2.5 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
      />
    </div>
  );
}
