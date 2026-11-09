import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Entry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ leaderboard: Entry[] }>('/api/leaderboard')
      .then((data) => setEntries(data.leaderboard))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {loading ? <p role="status">Loading leaderboard...</p> : error ? <p role="alert">Unable to load leaderboard.</p> : entries.length === 0 ? <p>No leaderboard rankings available.</p> : <ol>
      {entries.map((entry) => <li key={entry.rank}>{entry.rank}. {entry.teamName}: {entry.totalPoints} points</li>)}
    </ol>}
  </div></section>;
}
