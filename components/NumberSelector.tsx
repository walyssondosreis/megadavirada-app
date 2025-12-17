'use client';

import { Shuffle, X } from 'lucide-react';

interface NumberSelectorProps {
  selectedNumbers: number[];
  onNumbersChange: (numbers: number[]) => void;
  label: string;
}

export default function NumberSelector({
  selectedNumbers,
  onNumbersChange,
  label,
}: NumberSelectorProps) {
  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      onNumbersChange(selectedNumbers.filter((n) => n !== num));
    } else {
      if (selectedNumbers.length < 6) {
        onNumbersChange([...selectedNumbers, num].sort((a, b) => a - b));
      }
    }
  };

  const randomSelect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const numbers: number[] = [];
    while (numbers.length < 6) {
      const rand = Math.floor(Math.random() * 60) + 1;
      if (!numbers.includes(rand)) {
        numbers.push(rand);
      }
    }
    onNumbersChange(numbers.sort((a, b) => a - b));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    onNumbersChange([]);
  };

  const handleNumberClick = (e: React.MouseEvent, num: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    toggleNumber(num);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{label}</h3>
        <span className="text-sm text-gray-600">
          {selectedNumbers.length}/6
        </span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={randomSelect}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Shuffle size={16} />
          Aleatório
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <X size={16} />
          Limpar
        </button>
      </div>

      <div className="grid grid-cols-10 gap-1 sm:gap-2">
        {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={(e) => handleNumberClick(e, num)}
            disabled={
              selectedNumbers.length >= 6 && !selectedNumbers.includes(num)
            }
            className={`
              aspect-square rounded-lg font-semibold text-xs sm:text-sm transition-all
              ${
                selectedNumbers.includes(num)
                  ? 'bg-green-600 text-white scale-110 shadow-lg'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }
              ${
                selectedNumbers.length >= 6 && !selectedNumbers.includes(num)
                  ? 'opacity-40 cursor-not-allowed'
                  : 'cursor-pointer'
              }
            `}
          >
            {num.toString().padStart(2, '0')}
          </button>
        ))}
      </div>
    </div>
  );
}