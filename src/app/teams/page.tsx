'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Team {
  id: number;
  name: string;
  age_group: string | null;
  division: string | null;
  sport: string | null;
  coach_name: string | null;
  coach_email: string | null;
  coach_phone: string | null;
}

interface Coach {
  id: number;
  team_id: number;
  name: string;
  email: string | null;
  phone: string | null;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ageGroup: '',
    division: '',
    sport: '',
    coachName: '',
    coachEmail: '',
    coachPhone: ''
  });

  // Multi-coach modal state
  const [showCoachesModal, setShowCoachesModal] = useState(false);
  const [selectedTeamForCoaches, setSelectedTeamForCoaches] = useState<Team | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachFormData, setCoachFormData] = useState({ name: '', email: '', phone: '' });
  const [editingCoach, setEditingCoach] = useState<Coach | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  async function fetchTeams() {
    try {
      const res = await fetch('/api/teams');
      const data = await res.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCoaches(teamId: number) {
    try {
      const res = await fetch(`/api/coaches?teamId=${teamId}`);
      const data = await res.json();
      setCoaches(data);
    } catch (error) {
      console.error('Error fetching coaches:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const url = editingTeam ? `/api/teams/${editingTeam.id}` : '/api/teams';
    const method = editingTeam ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', ageGroup: '', division: '', sport: '', coachName: '', coachEmail: '', coachPhone: '' });
        setEditingTeam(null);
        fetchTeams();
      }
    } catch (error) {
      console.error('Error saving team:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    try {
      await fetch(`/api/teams/${id}`, { method: 'DELETE' });
      fetchTeams();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  }

  function openEdit(team: Team) {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      ageGroup: team.age_group || '',
      division: team.division || '',
      sport: team.sport || '',
      coachName: team.coach_name || '',
      coachEmail: team.coach_email || '',
      coachPhone: team.coach_phone || ''
    });
    setShowModal(true);
  }

  function openCoachesModal(team: Team) {
    setSelectedTeamForCoaches(team);
    setShowCoachesModal(true);
    fetchCoaches(team.id);
  }

  async function handleCoachSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTeamForCoaches) return;

    const url = editingCoach ? `/api/coaches/${editingCoach.id}` : '/api/coaches';
    const method = editingCoach ? 'PUT' : 'POST';
    
    const payload = {
      ...coachFormData,
      teamId: selectedTeamForCoaches.id
    };
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setCoachFormData({ name: '', email: '', phone: '' });
        setEditingCoach(null);
        fetchCoaches(selectedTeamForCoaches.id);
      }
    } catch (error) {
      console.error('Error saving coach:', error);
    }
  }

  async function handleCoachDelete(id: number) {
    if (!confirm('Are you sure you want to remove this coach?')) return;
    
    try {
      await fetch(`/api/coaches/${id}`, { method: 'DELETE' });
      if (selectedTeamForCoaches) fetchCoaches(selectedTeamForCoaches.id);
    } catch (error) {
      console.error('Error deleting coach:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="header">
        <h1 className="title">👥 Teams</h1>
        <button className="btn btn-primary" onClick={() => { setEditingTeam(null); setFormData({ name: '', ageGroup: '', division: '', sport: '', coachName: '', coachEmail: '', coachPhone: '' }); setShowModal(true); }}>
          + Add Team
        </button>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link active">Teams</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {teams.length === 0 ? (
        <div className="empty-state">
          <p>No teams yet. Add your first team to get started!</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {teams.map(team => (
            <div key={team.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{team.name}</h3>
                  {team.coach_name && <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>Coach: {team.coach_name}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEdit(team)}>Edit</button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(team.id)}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {team.age_group && <span className="badge badge-success">{team.age_group}</span>}
                {team.division && <span className="badge badge-warning">{team.division}</span>}
                {team.sport && <span className="badge badge-success">{team.sport}</span>}
              </div>
              {team.coach_email && (
                <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.5rem' }}>{team.coach_email}</p>
              )}
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '0.75rem', fontSize: '0.75rem' }}
                onClick={() => openCoachesModal(team)}
              >
                + Manage Coaches
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Team Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingTeam ? 'Edit Team' : 'Add Team'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Team Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Age Group</label>
                  <select
                    className="form-select"
                    value={formData.ageGroup}
                    onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="U6">U6</option>
                    <option value="U8">U8</option>
                    <option value="U10">U10</option>
                    <option value="U12">U12</option>
                    <option value="U14">U14</option>
                    <option value="U16">U16</option>
                    <option value="U18">U18</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Division</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.division}
                    onChange={e => setFormData({ ...formData, division: e.target.value })}
                    placeholder="e.g., Blue, Premier"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Sport</label>
                <select
                  className="form-select"
                  value={formData.sport}
                  onChange={e => setFormData({ ...formData, sport: e.target.value })}
                >
                  <option value="">Select...</option>
                  <option value="Soccer">Soccer</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Baseball">Baseball</option>
                  <option value="Softball">Softball</option>
                  <option value="Football">Football</option>
                  <option value="Volleyball">Volleyball</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Coach Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.coachName}
                  onChange={e => setFormData({ ...formData, coachName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Coach Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={formData.coachEmail}
                  onChange={e => setFormData({ ...formData, coachEmail: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Coach Phone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.coachPhone}
                  onChange={e => setFormData({ ...formData, coachPhone: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingTeam ? 'Update' : 'Add'} Team</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coaches Modal */}
      {showCoachesModal && selectedTeamForCoaches && (
        <div className="modal-overlay" onClick={() => setShowCoachesModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Coaches - {selectedTeamForCoaches.name}</h2>
              <button className="modal-close" onClick={() => setShowCoachesModal(false)}>&times;</button>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.75rem' }}>
                Add additional coaches for this team (e.g., assistant coaches, team managers).
              </p>
              <form onSubmit={handleCoachSubmit} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Coach name"
                    value={coachFormData.name}
                    onChange={e => setCoachFormData({ ...coachFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="Email (optional)"
                    value={coachFormData.email}
                    onChange={e => setCoachFormData({ ...coachFormData, email: e.target.value })}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="Phone (optional)"
                    value={coachFormData.phone}
                    onChange={e => setCoachFormData({ ...coachFormData, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary">{editingCoach ? 'Update' : 'Add'}</button>
              </form>
            </div>

            {coaches.length === 0 ? (
              <p style={{ color: 'var(--secondary)', textAlign: 'center', padding: '1rem' }}>No additional coaches yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coaches.map(coach => (
                    <tr key={coach.id}>
                      <td><strong>{coach.name}</strong></td>
                      <td>{coach.email || '-'}</td>
                      <td>{coach.phone || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => {
                              setEditingCoach(coach);
                              setCoachFormData({ name: coach.name, email: coach.email || '', phone: coach.phone || '' });
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-danger" 
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                            onClick={() => handleCoachDelete(coach.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
