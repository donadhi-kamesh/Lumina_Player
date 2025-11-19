import React, { useState } from 'react';
import { SearchIcon, XIcon, FilmIcon } from './Icons';
import { SearchResult, VideoMetadata } from '../types';

interface MetadataSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (meta: VideoMetadata) => void;
}

export const MetadataSelector: React.FC<MetadataSelectorProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchShows = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.map((item: any) => item.show));
    } catch (err) {
      console.error("Failed to search", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full md:w-96 bg-zinc-950/95 backdrop-blur-xl border-l border-zinc-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out animate-in slide-in-from-right">
      {/* Header */}
      <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-violet-400">
          <FilmIcon className="w-5 h-5" />
          <h2 className="font-semibold text-zinc-100">Metadata Search</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-zinc-800">
        <form onSubmit={searchShows} className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Series or Movies..."
            className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg pl-10 pr-4 py-2.5 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
            autoFocus
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <button 
            type="submit" 
            disabled={loading || !query}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium px-2 py-1 rounded disabled:opacity-50"
          >
            {loading ? '...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {results.length === 0 && !loading && (
            <div className="text-center text-zinc-500 mt-10">
                <FilmIcon className="w-12 h-12 mx-auto opacity-20 mb-2" />
                <p className="text-sm">Search for a show to fetch details.</p>
            </div>
        )}
        
        {results.map((show) => (
          <button
            key={show.id}
            onClick={() => {
                onSelect({
                    title: show.name,
                    description: show.summary?.replace(/<[^>]*>/g, '') || '', // Strip HTML
                    poster: show.image?.medium,
                    year: show.premiered?.split('-')[0],
                    rating: show.rating?.average
                });
                onClose();
            }}
            className="w-full flex gap-3 p-3 rounded-xl hover:bg-zinc-900 border border-transparent hover:border-zinc-700 transition-all text-left group"
          >
            <div className="w-16 h-24 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0">
                {show.image?.medium ? (
                    <img src={show.image.medium} alt={show.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <FilmIcon className="w-6 h-6 text-zinc-600" />
                    </div>
                )}
            </div>
            <div className="flex-1">
                <h3 className="text-zinc-200 font-medium leading-tight mb-1">{show.name}</h3>
                {show.premiered && <span className="text-xs text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{show.premiered.split('-')[0]}</span>}
                <p className="text-xs text-zinc-400 mt-2 line-clamp-2">{show.summary?.replace(/<[^>]*>/g, '')}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};