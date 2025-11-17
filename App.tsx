import React, { useState, useCallback, useEffect } from 'react';
import { Stock, Source } from './types';
import { fetchPromisingStocks } from './services/geminiService';
import SearchForm from './components/SearchForm';
import StockCard from './components/StockCard';
import LoadingSpinner from './components/LoadingSpinner';
import SourceLink from './components/SourceLink';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('AI technology stocks');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<Stock[]>([]);
  const [view, setView] = useState<'search' | 'watchlist'>('search');

  useEffect(() => {
    try {
      const savedWatchlist = localStorage.getItem('stockWatchlist');
      if (savedWatchlist) {
        setWatchlist(JSON.parse(savedWatchlist));
      }
    } catch (e) {
      console.error('Could not load watchlist from localStorage', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('stockWatchlist', JSON.stringify(watchlist));
    } catch (e) {
      console.error('Could not save watchlist to localStorage', e);
    }
  }, [watchlist]);

  const handleSubmit = useCallback(async (currentQuery: string) => {
    if (!currentQuery.trim()) {
      setError('Please enter a topic to search for.');
      return;
    }
    setView('search');
    setLoading(true);
    setError(null);
    setStocks([]);
    setSources([]);

    try {
      const result = await fetchPromisingStocks(currentQuery);
      setStocks(result.stocks);
      setSources(result.sources);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`Failed to fetch stock data: ${err.message}. Please try again.`);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    handleSubmit(exampleQuery);
  };
  
  const handleAddToWatchlist = useCallback((stock: Stock) => {
    setWatchlist((prev) => {
      if (prev.some(s => s.ticker === stock.ticker)) return prev;
      return [...prev, stock];
    });
  }, []);

  const handleRemoveFromWatchlist = useCallback((ticker: string) => {
    setWatchlist((prev) => prev.filter(s => s.ticker !== ticker));
  }, []);

  const isStockInWatchlist = useCallback((ticker: string): boolean => {
    return watchlist.some(s => s.ticker === ticker);
  }, [watchlist]);

  const exampleQueries = [
    "Renewable energy companies",
    "Biotechnology breakthroughs",
    "E-commerce giants",
    "Cybersecurity firms"
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white selection:bg-teal-500 selection:text-white">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-blue-500 pb-2">
            AI Stock Analyst
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mt-2 max-w-2xl mx-auto">
            Discover stocks with high growth potential. Enter a sector or trend to get AI-powered analysis and public sentiment.
          </p>
        </header>

        <div className="flex justify-center border-b border-gray-700 mb-8">
          <button
            onClick={() => setView('search')}
            className={`px-6 py-3 font-medium transition-colors ${view === 'search' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}
            aria-pressed={view === 'search'}
          >
            Stock Search
          </button>
          <button
            onClick={() => setView('watchlist')}
            className={`px-6 py-3 font-medium transition-colors relative ${view === 'watchlist' ? 'text-teal-400 border-b-2 border-teal-400' : 'text-gray-400 hover:text-white'}`}
            aria-pressed={view === 'watchlist'}
          >
            Watchlist
            {watchlist.length > 0 && (
              <span className="absolute top-2 right-0 -mr-1 flex items-center justify-center h-5 w-5 bg-blue-600 text-white text-xs rounded-full">
                {watchlist.length}
              </span>
            )}
          </button>
        </div>

        {view === 'search' && (
          <section aria-labelledby="search-heading">
            <h2 id="search-heading" className="sr-only">Stock Search</h2>
            <SearchForm query={query} setQuery={setQuery} onSubmit={() => handleSubmit(query)} loading={loading} />
            <div className="flex flex-wrap justify-center gap-2 mt-4 mb-8">
              <span className="text-gray-400 text-sm self-center mr-2">Try:</span>
              {exampleQueries.map(ex => (
                <button
                  key={ex}
                  onClick={() => handleExampleClick(ex)}
                  disabled={loading}
                  className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-sm hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {ex}
                </button>
              ))}
            </div>
          </section>
        )}

        {loading && <LoadingSpinner />}
        
        {error && <p className="text-center text-red-400 mt-8 bg-red-900/50 p-4 rounded-lg">{error}</p>}

        {!loading && (
          <>
            {view === 'search' && stocks.length > 0 && (
              <section aria-labelledby="search-results-heading">
                <h2 id="search-results-heading" className="sr-only">Search Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                  {stocks.map((stock) => (
                    <StockCard 
                      key={stock.ticker} 
                      stock={stock} 
                      isInWatchlist={isStockInWatchlist(stock.ticker)}
                      onAddToWatchlist={handleAddToWatchlist}
                      onRemoveFromWatchlist={handleRemoveFromWatchlist}
                    />
                  ))}
                </div>
                {sources.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-xl font-semibold text-gray-300 mb-4 text-center">Sources</h3>
                    <div className="flex flex-wrap justify-center gap-4">
                      {sources.map((source, index) => (
                        <SourceLink key={index} source={source} />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {view === 'watchlist' && (
              <section aria-labelledby="watchlist-heading">
                <h2 id="watchlist-heading" className="text-3xl font-bold text-center text-gray-200 mb-8">My Watchlist</h2>
                {watchlist.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {watchlist.map((stock) => (
                      <StockCard 
                        key={stock.ticker} 
                        stock={stock} 
                        isInWatchlist={true}
                        onAddToWatchlist={handleAddToWatchlist}
                        onRemoveFromWatchlist={handleRemoveFromWatchlist}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 px-4 bg-gray-800/30 rounded-lg">
                    <p className="text-gray-400 text-lg">Your watchlist is empty.</p>
                    <p className="text-gray-500 mt-2">Use the "Stock Search" tab to find and add stocks.</p>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. Data may not be real-time financial advice.</p>
      </footer>
    </div>
  );
};

export default App;
