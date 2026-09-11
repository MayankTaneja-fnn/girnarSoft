import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  "Setting DTU delivery coordinates...",
  "Checking Blinkit dark store...",
  "Checking Instamart...",
  "Matching products...",
  "Comparing prices..."
];

function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(prev => (prev < LOADING_MESSAGES.length - 1 ? prev + 1 : prev));
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (searchQuery) => {
    const q = typeof searchQuery === 'string' ? searchQuery : query;
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setError(null);
    setResults([]);
    setStats(null);

    try {
      const response = await fetch(`http://localhost:8000/api/search?q=${encodeURIComponent(q)}`);
      if (!response.ok) throw new Error('Failed to fetch data from comparison engine.');
      const data = await response.json();
      setResults(data.results || []);
      setStats(data.raw_counts);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderProductCard = (product, fallbackTitle, isCheaper, savingsPct, priceDiff) => {
    if (!product) {
      return (
        <div className="flex-1 p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center bg-slate-50 text-slate-400 min-h-[220px]">
          <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-sm font-medium">No matching product found on {fallbackTitle}</span>
        </div>
      );
    }

    const isBlinkit = product.source === 'Blinkit';
    const brandTheme = isBlinkit 
      ? 'border-[#F8CB46] focus:ring-[#F8CB46] text-yellow-900 bg-yellow-50/30' 
      : 'border-[#FC8019] focus:ring-[#FC8019] text-orange-900 bg-orange-50/30';
    const brandColor = isBlinkit ? 'text-[#e5b31f]' : 'text-[#FC8019]';
    const brandBg = isBlinkit ? 'bg-[#F8CB46]' : 'bg-[#FC8019]';

    return (
      <div className={`relative flex-1 flex flex-col p-5 border-2 rounded-xl hover:shadow-lg transition-all duration-200 ${brandTheme} min-h-[220px] bg-white`}>
        {isCheaper && priceDiff > 0 && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            Cheaper by ₹{priceDiff} ({savingsPct}% less)
          </div>
        )}
        
        <div className="flex justify-between items-start mb-3">
          <div className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md text-white ${brandBg}`}>
            {product.source}
          </div>
          <div className="text-2xl font-extrabold text-slate-800">
            ₹{product.price}
          </div>
        </div>

        <div className="flex gap-4 flex-1">
          {product.image_url ? (
            <img 
              src={product.image_url} 
              alt={product.name} 
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
              }}
              className="w-24 h-24 object-contain rounded-lg p-1 bg-white border border-slate-100 mix-blend-multiply" 
            />
          ) : null}
          <div className={`w-24 h-24 bg-slate-100 rounded-lg border border-slate-200 items-center justify-center text-slate-300 ${product.image_url ? 'hidden' : 'flex'}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div className="flex flex-col flex-1">
            <h3 className="font-semibold text-slate-800 text-sm leading-tight line-clamp-3 mb-1">{product.name}</h3>
            <p className="text-slate-500 text-xs font-medium bg-slate-100 self-start px-2 py-1 rounded">{product.weight}</p>
          </div>
        </div>

        <a href={product.url} target="_blank" rel="noopener noreferrer" className={`mt-4 block w-full text-center py-2 rounded-lg text-sm font-semibold text-white transition-colors hover:opacity-90 ${brandBg}`}>
          Buy on {product.source}
        </a>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-4">
            <div className="flex flex-col items-center md:items-start">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">The Great DTU Grocery Race</h1>
              <div className="flex items-center gap-1.5 mt-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                DTU Campus, Rohini - 110042
              </div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="flex w-full md:w-auto flex-1 max-w-lg relative group">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search grocery item (e.g., Bread, Amul Butter)"
                className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-l-xl focus:outline-none focus:ring-0 focus:border-slate-800 transition-colors text-slate-800 font-medium placeholder:text-slate-400"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="px-8 py-3 bg-slate-900 text-white font-bold rounded-r-xl hover:bg-slate-800 disabled:opacity-50 transition-colors border-2 border-slate-900 disabled:border-slate-400 disabled:bg-slate-400"
              >
                Compare
              </button>
            </form>
          </div>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-2">Quick Picks:</span>
            {['Maggi', 'Amul Butter', 'Bread', 'Coke', 'Milk', 'Chips', 'Eggs'].map(item => (
              <button 
                key={item} 
                onClick={() => handleSearch(item)}
                disabled={loading}
                className="px-3 py-1 text-xs font-medium bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {error && (
          <div className="p-4 mb-8 bg-red-50 text-red-700 rounded-xl border border-red-200 flex items-center gap-3">
            <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span className="font-medium">{error}</span>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-semibold text-slate-800 mb-2">{LOADING_MESSAGES[loadingStep]}</p>
            <p className="text-sm text-slate-400">Scraping directly from live stores (up to 8 seconds)...</p>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-xl font-bold text-slate-800">Results for "{query}"</h2>
              <div className="text-sm font-medium text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-200">
                Found {stats?.blinkit ?? 0} on Blinkit, {stats?.instamart ?? 0} on Instamart
              </div>
            </div>
            
            <div className="flex flex-col gap-8">
              {results.map((match, idx) => {
                const bPrice = match.blinkit?.price || Infinity;
                const iPrice = match.instamart?.price || Infinity;
                const blinkitCheaper = bPrice < iPrice && match.instamart;
                const instamartCheaper = iPrice < bPrice && match.blinkit;
                const isExact = match.confidence > 85;

                return (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group">
                    <div className="flex flex-col md:flex-row gap-0 md:gap-4 p-4">
                      
                      <div className="flex-1 w-full relative">
                         {renderProductCard(match.blinkit, "Blinkit", blinkitCheaper, match.savings_pct, match.price_diff)}
                      </div>
                      
                      <div className="flex md:flex-col justify-center items-center py-4 md:py-0 text-slate-300 md:px-2">
                        <div className="h-[1px] w-full md:h-full md:w-[1px] bg-slate-100"></div>
                        <div className="bg-slate-50 p-2 rounded-full border border-slate-100 my-0 mx-4 md:my-4 md:mx-0 shrink-0">
                          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                        </div>
                        <div className="h-[1px] w-full md:h-full md:w-[1px] bg-slate-100"></div>
                      </div>

                      <div className="flex-1 w-full relative">
                         {renderProductCard(match.instamart, "Instamart", instamartCheaper, match.savings_pct, match.price_diff)}
                      </div>
                    </div>

                    {match.confidence > 0 && (
                       <div className={`px-6 py-3 border-t text-sm font-medium flex items-center justify-center gap-2 ${isExact ? 'bg-slate-50 text-slate-600 border-slate-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {isExact ? (
                            <><svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg> High Confidence Match ({match.confidence}%)</>
                          ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg> Approximate Match ({match.confidence}%). Might be different variants.</>
                          )}
                       </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="text-center py-24 bg-white rounded-2xl border border-slate-200 border-dashed">
             <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
             </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">No results found for "{query}"</h3>
            <p className="text-slate-500">Try searching for generic terms like "Bread" or "Chips".</p>
          </div>
        )}

        {!loading && !error && !query && results.length === 0 && (
          <div className="text-center py-32 max-w-lg mx-auto">
             <div className="flex justify-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#F8CB46] rounded-2xl shadow-lg rotate-12 flex items-center justify-center text-yellow-900 font-bold text-2xl">B</div>
                <div className="w-16 h-16 bg-[#FC8019] rounded-2xl shadow-lg -rotate-12 flex items-center justify-center text-white font-bold text-2xl">I</div>
             </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Live Price Comparison</h2>
            <p className="text-slate-500 text-base leading-relaxed">
              We live-scrape Blinkit and Instamart from DTU campus boundaries, extract weights and titles, and use a fuzzy matching engine to find you the absolute cheapest option for your late night cravings.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
