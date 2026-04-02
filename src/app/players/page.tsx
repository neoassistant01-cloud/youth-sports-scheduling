'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

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
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    parentName: '',
    parentEmail: '',
    parentPhone: ''
  });
  const [importData, setImportData] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      fetchPlayers(selectedTeamId);
    }
  }, [selectedTeamId]);

  // Check for teamId in URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTeamId = params.get('teamId');
    if (urlTeamId && !selectedTeamId) {
      setSelectedTeamId(parseInt(urlTeamId));
    }
  }, []);

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
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teamId: selectedTeamId })
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
    if (!confirm('Remove this player from the roster?')) return;
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

  function exportPlayers() {
    if (selectedTeamId) {
      window.open(`/api/players/export?teamId=${selectedTeamId}`, '_blank');
    }
  }

  function downloadTemplate() {
    const template = "FirstName,LastName,ParentName,ParentEmail,ParentPhone\nJohn,Smith,John Smith Sr.,john@email.com,555-123-4567";
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roster_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!selectedTeamId || !importData.trim()) return;
    
    const lines = importData.trim().split('\n');
    let successCount = 0;
    
    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 2) {
        try {
          const res = await fetch('/api/players', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: parts[0],
              lastName: parts[1],
              parentName: parts[2] || '',
              parentEmail: parts[3] || '',
              parentPhone: parts[4] || '',
              teamId: selectedTeamId
            })
          });
          if (res.ok) successCount++;
        } catch (error) {
          console.error('Error importing:', error);
        }
      }
    }
    
    setShowImportModal(false);
    setImportData('');
    fetchPlayers(selectedTeamId);
    alert(`Imported ${successCount} players!`);
  }

  const filteredPlayers = players.filter(player => 
    player.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.parent_name && player.parent_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <div>Loading...</div>;

  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div>
      <div className="header">
        <h1 className="title">🏃 Players</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={exportPlayers} disabled={!selectedTeamId}>📥 Export</button>
          <button className="btn btn-secondary" onClick={() => setShowImportModal(true)} disabled={!selectedTeamId}>📤 Import</button>
          <button className="btn btn-primary" onClick={openAdd} disabled={!selectedTeamId}>+ Add Player</button>
        </div>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/players" className="nav-link active">Players</Link>
        <Link href="/coaches" className="nav-link">Coaches</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {teams.length === 0 ? (
        <div className="empty-state">
          <p>No teams exist yet. Create a team first.</p>
          <Link href="/teams" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Create Team
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">Select Team</label>
              <select 
                className="form-select" 
                style={{ maxWidth: '300px' }} 
                value={selectedTeamId || ''} 
                onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}
              >
                {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Search Players</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="Search by name or parent..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
              />
            </div>
          </div>

          {selectedTeam && (
            <div style={{ marginBottom: '1rem', color: 'var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Managing roster for: <strong>{selectedTeam.name}</strong></span>
              <span className="badge badge-primary">{filteredPlayers.length} players</span>
            </div>
          )}

          {filteredPlayers.length === 0 ? (
            <div className="empty-state">
              <p>{searchQuery ? 'No matches found.' : 'No players on this roster yet.'}</p>
              {!searchQuery && (
                <button className="btn btn-primary" style={{ marginTop: '0.5rem' }} onClick={openAdd}>
                  Add First Player
                </button>
              )}
            </div>
          ) : (
            <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
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
                  {filteredPlayers.map(player => (
                    <tr key={player.id}>
                      <td>
                        <strong>{player.first_name} {player.last_name}</strong>
                      </td>
                      <td>{player.parent_name || '-'}</td>
                      <td>
                        {player.parent_email && <div>{player.parent_email}</div>}
                        {player.parent_phone && <div style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>{player.parent_phone}</div>}
                        {!player.parent_email && !player.parent_phone && <span style={{ color: 'var(--secondary)' }}>-</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                            onClick={() => openEdit(player)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} 
                            onClick={() => handleDelete(player.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
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

      {/* Import Modal */}
      {showImportModal && (
        <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Bulk Import Players</h2>
              <button className="modal-close" onClick={() => setShowImportModal(false)}>&times;</button>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
              Format: FirstName,LastName,ParentName,ParentEmail,ParentPhone
            </p>
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ fontSize: '0.75rem', marginBottom: '1rem' }} 
              onClick={downloadTemplate}
            >
              📥 Download Template
            </button>
            <textarea 
              className="form-textarea" 
              rows={8} 
              placeholder="John,Smith,John Smith,john@email.com,555-1234" 
              value={importData} 
              onChange={(e) => setImportData(e.target.value)} 
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowImportModal(false)}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={handleImport} disabled={!importData.trim()}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
