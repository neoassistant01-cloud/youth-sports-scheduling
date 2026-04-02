'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Player {
  id: number;
  team_id: number;
  first_name: string;
  last_name: string;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
}

interface Team {
  id: number;
  name: string;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    parentName: '',
    parentEmail: '',
    parentPhone: ''
  });

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlayers(selectedTeamId);
    }
  }, [selectedTeamId]);

  async function fetchTeams() {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) {
        setSelectedTeamId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlayers(teamId: number) {
    try {
      const res = await fetch(`/api/players?teamId=${teamId}`);
      const data = await res.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!selectedTeamId) return;
    
    const url = editingPlayer ? `/api/players/${editingPlayer.id}` : '/api/players';
    const method = editingPlayer ? 'PUT' : 'POST';
    
    const payload = {
      ...formData,
      teamId: selectedTeamId
    };
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ firstName: '', lastName: '', parentName: '', parentEmail: '', parentPhone: '' });
        setEditingPlayer(null);
        fetchPlayers(selectedTeamId);
      }
    } catch (error) {
      console.error('Error saving player:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this player?')) return;
    
    try {
      await fetch(`/api/players/${id}`, { method: 'DELETE' });
      if (selectedTeamId) fetchPlayers(selectedTeamId);
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  }

  function openEdit(player: Player) {
    setEditingPlayer(player);
    setFormData({
      firstName: player.first_name,
      lastName: player.last_name,
      parentName: player.parent_name || '',
      parentEmail: player.parent_email || '',
      parentPhone: player.parent_phone || ''
    });
    setShowModal(true);
  }

  function openAdd() {
    setEditingPlayer(null);
    setFormData({ firstName: '', lastName: '', parentName: '', parentEmail: '', parentPhone: '' });
    setShowModal(true);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div>
      <div className="header">
        <h1 className="title">🏃 Players</h1>
        <button className="btn btn-primary" onClick={openAdd} disabled={!selectedTeamId}>
          + Add Player
        </button>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/players" className="nav-link active">Players</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {teams.length === 0 ? (
        <div className="empty-state">
          <p>No teams exist yet. Create a team first before adding players.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <label className="form-label">Select Team</label>
            <select 
              className="form-select" 
              style={{ maxWidth: '300px' }}
              value={selectedTeamId || ''}
              onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>

          {selectedTeam && (
            <div style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>
              Managing players for: <strong>{selectedTeam.name}</strong>
            </div>
          )}

          {players.length === 0 ? (
            <div className="empty-state">
              <p>No players on this team yet. Add your first player!</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Parent/Guardian</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map(player => (
                  <tr key={player.id}>
                    <td>
                      <strong>{player.first_name} {player.last_name}</strong>
                    </td>
                    <td>{player.parent_name || '-'}</td>
                    <td>
                      {player.parent_email && <div>{player.parent_email}</div>}
                      {player.parent_phone && <div>{player.parent_phone}</div>}
                      {!player.parent_email && !player.parent_phone && <span>-</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEdit(player)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(player.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingPlayer ? 'Edit Player' : 'Add Player'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.firstName}
                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.lastName}
                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Parent/Guardian Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.parentName}
                  onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.parentEmail}
                  onChange={e => setFormData({ ...formData, parentEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Parent Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingPlayer ? 'Update' : 'Add'} Player</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
