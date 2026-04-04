'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Coach {
  id: number;
  team_id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

interface Team {
  id: number;
  name: string;
}

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });

  useEffect(() => { fetchTeams(); }, []);
  useEffect(() => { if (selectedTeamId) fetchCoaches(selectedTeamId); }, [selectedTeamId]);

  async function fetchTeams() {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
      if (data.length > 0 && !selectedTeamId) setSelectedTeamId(data[0].id);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  }

  async function fetchCoaches(teamId: number) {
    try {
      const res = await fetch(`/api/coaches?teamId=${teamId}`);
      setCoaches(await res.json());
    } catch (error) { console.error('Error:', error); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamId) return;
    const url = editingCoach ? `/api/coaches/${editingCoach.id}` : '/api/coaches';
    const method = editingCoach ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...formData, teamId: selectedTeamId }) });
      if (res.ok) { setShowModal(false); setFormData({ name: '', email: '', phone: '' }); setEditingCoach(null); fetchCoaches(selectedTeamId); }
    } catch (error) { console.error('Error:', error); }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this coach?')) return;
    try { await fetch(`/api/coaches/${id}`, { method: 'DELETE' }); if (selectedTeamId) fetchCoaches(selectedTeamId); }
    catch (error) { console.error('Error:', error); }
  }

  function openEdit(coach: Coach) { setEditingCoach(coach); setFormData({ name: coach.name, email: coach.email || '', phone: coach.phone || '' }); setShowModal(true); }
  function openAdd() { setEditingCoach(null); setFormData({ name: '', email: '', phone: '' }); setShowModal(true); }
  function exportCoaches() { if (selectedTeamId) window.open(`/api/coaches/export?teamId=${selectedTeamId}`, '_blank'); }

  const filteredCoaches = coaches.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())));

  if (loading) return <div>Loading...</div>;
  const selectedTeam = teams.find(t => t.id === selectedTeamId);

  return (
    <div>
      <div className="header">
        <h1 className="title">👨‍🏫 Coaches</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={exportCoaches} disabled={!selectedTeamId}>📥 Export</button>
          <button className="btn btn-primary" onClick={openAdd} disabled={!selectedTeamId}>+ Add Coach</button>
        </div>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/players" className="nav-link">Players</Link>
        <Link href="/coaches" className="nav-link active">Coaches</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {teams.length === 0 ? (
        <div className="empty-state"><p>No teams exist yet.</p></div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">Select Team</label>
              <select className="form-select" style={{ maxWidth: '300px' }} value={selectedTeamId || ''} onChange={(e) => setSelectedTeamId(parseInt(e.target.value))}>
                {teams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Search Coaches</label>
              <input type="text" className="form-input" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>

          {selectedTeam && (
            <div style={{ marginBottom: '1rem', color: 'var(--secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Managing: <strong>{selectedTeam.name}</strong></span>
              <span className="badge badge-primary">{filteredCoaches.length} coaches</span>
            </div>
          )}

          {filteredCoaches.length === 0 ? (
            <div className="empty-state"><p>{searchQuery ? 'No matches.' : 'No coaches yet.'}</p></div>
          ) : (
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Actions</th></tr></thead>
              <tbody>
                {filteredCoaches.map(coach => (
                  <tr key={coach.id}>
                    <td><strong>{coach.name}</strong></td>
                    <td>{coach.email || '-'}</td>
                    <td>{coach.phone || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEdit(coach)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(coach.id)}>Delete</button>
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
              <h2 className="modal-title">{editingCoach ? 'Edit Coach' : 'Add Coach'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Name *</label><input type="text" className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input type="tel" className="form-input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCoach ? 'Update' : 'Add'} Coach</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
