import { useEffect, useState, useMemo } from "react";
import axios from "axios";

interface Listing {
  title: string;
  detail_url: string;
  price: number;
  year?: number;
  model?: string;
  slides?: number;
  converter?: string;
  featured_image?: string;
}

export default function SimpleApp() {
  const [all, setAll] = useState<Listing[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"price"|"year">("price");
  const [dir, setDir] = useState<"asc"|"desc">("desc");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get<Listing[]>(`http://127.0.0.1:8000/listings?sort=${sort}&dir=${dir}`)
         .then(r => {
           setAll(r.data);
           setLoading(false);
         })
         .catch(err => {
           console.error("Failed to fetch listings:", err);
           setLoading(false);
         });
  }, [sort, dir]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? all.filter(l => l.title.toLowerCase().includes(q) || (l.model?.toLowerCase().includes(q)))
      : all;
  }, [all, query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#2C3E50] mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading luxury coaches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="px-6 py-4 max-w-5xl mx-auto">
        <h1 className="font-semibold text-2xl" style={{color:"#2C3E50"}}>CoachRanger</h1>
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            placeholder="Search model, converter, etc."
            className="flex-1 bg-white/80 backdrop-blur px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2C3E50]/40"
            onChange={e=>setQuery(e.target.value)}
            value={query}
          />

          <select value={sort} onChange={e=>setSort(e.target.value as any)}
            className="bg-white/80 px-3 py-2 rounded-md">
            <option value="price">Price</option>
            <option value="year">Year</option>
          </select>

          <button onClick={()=>setDir(dir==="asc"?"desc":"asc")}
            className="bg-[#2C3E50] text-white px-4 py-2 rounded-md hover:bg-[#34495e] transition-colors">
            {dir==="asc" ? "↑" : "↓"}
          </button>
        </div>
        <div className="mt-2 text-sm text-slate-600">
          Showing {visible.length} of {all.length} luxury coaches
        </div>
      </header>

      <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto px-6 pb-12">
        {visible.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-500">No coaches found matching your search.</p>
          </div>
        ) : (
          visible.map((l, index) => (
            <article key={l.detail_url || index} className="bg-white/70 backdrop-blur rounded-lg shadow-sm hover:shadow-md transition">
              {l.featured_image && (
                <img 
                  src={l.featured_image} 
                  alt={l.title} 
                  className="w-full h-56 object-cover rounded-t-lg"
                  onError={(e) => {
                    // Fallback to a placeholder if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='224' viewBox='0 0 400 224'%3E%3Crect width='400' height='224' fill='%23f1f5f9'/%3E%3Ctext x='200' y='112' text-anchor='middle' dy='.3em' fill='%2364748b' font-family='sans-serif' font-size='14'%3ECoach Image%3C/text%3E%3C/svg%3E";
                  }}
                />
              )}
              <div className="p-4">
                <h2 className="font-medium text-slate-900">{l.title}</h2>
                <p className="text-sm mt-1 font-semibold" style={{color:"#2C3E50"}}>
                  ${l.price.toLocaleString()} {l.year && `• ${l.year}`}
                </p>
                {l.model && (
                  <p className="text-xs text-slate-600 mt-1">
                    Model: {l.model}{l.slides ? ` • Slides: ${l.slides}` : ""}
                  </p>
                )}
                {l.converter && (
                  <p className="text-xs text-slate-600">
                    Converter: {l.converter}
                  </p>
                )}
                <a href={l.detail_url} target="_blank" rel="noopener"
                   className="inline-block mt-3 text-sm font-medium text-[#2C3E50]/80 hover:text-[#2C3E50] transition-colors">
                   View on Prevost‑stuff →
                </a>
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}