import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {loading ? <p role="status">Loading teams...</p> : error ? <p role="alert">Unable to load teams.</p> : teams.length === 0 ? <p>No teams available.</p> : <ul>
      {teams.map((team) => <li key={team.name}>{team.name}{team.members.length > 0 && `: ${team.members.join(', ')}`}</li>)}
    </ul>}
  </div></section>;
}
