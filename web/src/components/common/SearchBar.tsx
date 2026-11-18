import React, { useState } from 'react';
import { Search, X, Mic, MicOff } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search by name, number, category...',
  className = '',
}) => {
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please type your search.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          onChange(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div
      className={`relative flex items-center w-full transition-all ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '0 14px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Search
        size={19}
        style={{
          color: 'var(--text-tertiary)',
          flexShrink: 0,
          marginRight: '10px',
        }}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          height: '46px',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text)',
          fontSize: '14.5px',
          fontWeight: 500,
        }}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          style={{
            background: 'var(--surface-variant)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            marginRight: '6px',
          }}
          title="Clear search"
        >
          <X size={14} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={startVoiceSearch}
        style={{
          background: isListening ? '#EF4444' : 'transparent',
          border: 'none',
          borderRadius: '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: isListening ? '#FFFFFF' : 'var(--text-tertiary)',
          transition: 'all 0.2s ease',
        }}
        title="Voice Search"
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>
    </div>
  );
};
