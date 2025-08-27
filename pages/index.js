import { useState, useEffect } from 'react';

const K = 32;
const INITIAL_RATING = 1200;

/**
 * Calculate Elo ratings from a list of matches.
 * Each match is an object: { player1, player2, result }
 * result: 'player1' | 'player2' | 'draw'
 */
function calculateElo(matches) {
  const ratings = {};

  matches.forEach(({ player1, player2, result }) => {
    if (!(player1 in ratings)) ratings[player1] = INITIAL_RATING;
    if (!(player2 in ratings)) ratings[player2] = INITIAL_RATING;

    const R1 = ratings[player1];
    const R2 = ratings[player2];

    const E1 = 1 / (1 + Math.pow(10, (R2 - R1) / 400));
    const E2 = 1 / (1 + Math.pow(10, (R1 - R2) / 400));

    let S1, S2;
    if (result === 'player1') {
      S1 = 1;
      S2 = 0;
    } else if (result === 'player2') {
      S1 = 0;
      S2 = 1;
    } else {
      // draw
      S1 = 0.5;
      S2 = 0.5;
    }

    ratings[player1] = Math.round(R1 + K * (S1 - E1));
    ratings[player2] = Math.round(R2 + K * (S2 - E2));
  });

  return ratings;
}

export default function Home() {
  const [matches, setMatches] = useState([]);
  const [ratings, setRatings] = useState({});
  const [player1, setPlayer1] = useState('');
  const [player2, setPlayer2] = useState('');
  const [result, setResult] = useState('draw');

  // Load matches from the server (or empty) on mount
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/matches');
        const data = await res.json();
        setMatches(data);
        setRatings(calculateElo(data));
      } catch (e) {
        console.error('Failed to fetch matches', e);
      }
    };
    fetchMatches();
  }, []);

  // Update ratings whenever matches change
  useEffect(() => {
    setRatings(calculateElo(matches));
  }, [matches]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!player1.trim() || !player2.trim() || player1 === player2) {
      alert('Please provide two distinct player names.');
      return;
    }

    const newMatch = {
      player1: player1.trim(),
      player2: player2.trim(),
      result,
      date: new Date().toISOString(),
    };

    const res = await fetch('/api/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMatch),
    });
    const updated = await res.json();
    setMatches(updated);
    setPlayer1('');
    setPlayer2('');
    setResult('draw');
  };

  const sortedRatings = Object.entries(ratings).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1>Elo Tracker</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Player 1:{' '}
            <input
              type="text"
              value={player1}
              onChange={(e) => setPlayer1(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Player 2:{' '}
            <input
              type="text"
              value={player2}
              onChange={(e) => setPlayer2(e.target.value)}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Result:{' '}
            <select value={result} onChange={(e) => setResult(e.target.value)}>
              <option value="player1">Win – Player 1</option>
              <option value="player2">Win – Player 2</option>
              <option value="draw">Draw</option>
            </select>
          </label>
        </div>
        <button type="submit">Add Match</button>
      </form>

      <h2>Current Ratings</h2>
      {sortedRatings.length === 0 ? (
        <p>No matches recorded yet.</p>
      ) : (
        <table border="1" cellPadding="5" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Player</th>
              <th>Elo Rating</th>
            </tr>
          </thead>
          <tbody>
            {sortedRatings.map(([name, rating]) => (
              <tr key={name}>
                <td>{name}</td>
                <td>{rating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '2rem' }}>Match History</h2>
      {matches.length === 0 ? (
        <p>No matches recorded.</p>
      ) : (
        <ul>
          {matches.map((m, idx) => (
            <li key={idx}>
              {m.player1} vs {m.player2} –{' '}
              {m.result === 'player1'
                ? `${m.player1} won`
                : m.result === 'player2'
                ? `${m.player2} won`
                : 'Draw'}{' '}
              ({new Date(m.date).toLocaleDateString()})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
