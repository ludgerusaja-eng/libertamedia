import React, { useState, useEffect } from 'react';

interface TopBarProps {
  fontSize?: 'normal' | 'large';
  setFontSize?: (size: 'normal' | 'large') => void;
  onOpenAdmin?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenAdmin }) => {
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      setCurrentDate(now.toLocaleDateString('id-ID', options));
      setCurrentTime(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div id="top-bar-container" className="bg-slate-900 text-slate-300 text-xs py-1.5 border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Left: Date & Time */}
        <div className="flex items-center flex-wrap gap-3 text-slate-300">
          <div className="flex items-center gap-1.5 font-medium">
            <span>{currentDate || 'Memuat tanggal...'}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 font-mono">{currentTime}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
