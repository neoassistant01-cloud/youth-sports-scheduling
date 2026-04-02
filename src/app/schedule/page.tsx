'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Calendar from '@/components/Calendar';

interface Facility {
  id: number;
  name: string;
}

interface Team {
  id: number;
  name: string;
}

interface Schedule {
  id: number;
  facility_id: number;
  facility_name?: string;
  home_team_id: number;
  home_team_name?: string;
  away_team_id: number | null;
  away_team_name?: string;
  event_type: string;
  title: string;
  start_time: number;
  end_time: number;
  is_published: number;
  has_conflict: number;
  conflict_reason?: string | null;
}

export default function SchedulePage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<number | ''>('');
  const [selectedTeams, setSelectedTeams] = useState<number[]>([]);
  const [gameType, setGameType] = useState<'practice' | 'game'>('practice');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedEvent, setSelectedEvent] = useState<Schedule | null>(null);
  const [notifying, setNotifying] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [facRes, teamRes, schedRes] = await Promise.all([
        fetch('/api/facilities'),
        fetch('/api/teams'),
        fetch('/api/schedules')
      ]);
      setFacilities(await facRes.json());
      setTeams(await teamRes.json());
      setSchedules(await schedRes.json());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleTeam(teamId: number) {
    setSelectedTeams(prev => 
      prev.includes(teamId) 
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    );
  }

  async function generateSchedule() {
    if (!selectedFacility || selectedTeams.length < 1) {
      alert('Please select a facility and at least one team');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/schedules/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: selectedFacility,
          teamIds: selectedTeams,
          eventType: gameType
        })
      });
      
      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
    } finally {
      setGenerating(false);
    }
  }

  async function togglePublish(id: number, currentStatus: number) {
    try {
      await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus })
      });
      loadData();
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this schedule?')) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  }

  async function notifyParents(schedule: Schedule) {
    setNotifying(true);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: schedule.event_type,
          scheduleIds: [schedule.id]
        })
      });
      const data = await res.json();
      alert(data.message || 'Notification sent!');
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Failed to send notification');
    } finally {
      setNotifying(false);
    }
  }

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="header">
        <h1 className="title">📅 Schedule</h1>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/players" className="nav-link">Players</Link>
        <Link href="/coaches" className="nav-link">Coaches</Link>
        <Link href="/schedule" className="nav-link active">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Generate New Schedule</h3>
        
        <div className="form-group">
          <label className="form-label">Select Facility</label>
          <select 
            className="form-select"
            value={selectedFacility}
            onChange={e => setSelectedFacility(e.target.value ? parseInt(e.target.value) : '')}
          >
            <option value="">Choose facility...</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Event Type</label>
          <select 
            className="form-select"
            value={gameType}
            onChange={e => setGameType(e.target.value as 'practice' | 'game')}
          >
            <option value="practice">Practice</option>
            <option value="game">Game</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Select Teams</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            {teams.length === 0 ? (
              <p style={{ color: 'var(--secondary)' }}>No teams available. Add teams first.</p>
            ) : (
              teams.map(team => (
                <label key={team.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input 
                    type="checkbox"
                    checked={selectedTeams.includes(team.id)}
                    onChange={() => toggleTeam(team.id)}
                  />
                  {team.name}
                </label>
              ))
            )}
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={generateSchedule}
          disabled={generating || !selectedFacility || selectedTeams.length < 1}
        >
          {generating ? 'Generating...' : 'Generate Schedule'}
        </button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: 600, margin: 0 }}>Scheduled Events</h3>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button 
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button 
              className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
              onClick={() => setViewMode('calendar')}
            >
              Calendar
            </button>
          </div>
        </div>
        
        {schedules.length === 0 ? (
          <div className="empty-state">
            <p>No schedules yet. Generate your first schedule above.</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <Calendar 
            schedules={schedules} 
            onEventClick={(event) => setSelectedEvent(event)}
          />
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date/Time</th>
                <th>Event</th>
                <th>Teams</th>
                <th>Facility</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map(sched => (
                <tr key={sched.id}>
                  <td>{formatDate(sched.start_time)}</td>
                  <td>
                    <span className="badge" style={{ 
                      background: sched.event_type === 'game' ? '#dbeafe' : '#fce7f3',
                      color: sched.event_type === 'game' ? '#1e40af' : '#9d174d'
                    }}>
                      {sched.event_type}
                    </span>
                  </td>
                  <td>
                    {sched.home_team_name || 'TBD'}
                    {sched.away_team_name && ` vs ${sched.away_team_name}`}
                  </td>
                  <td>{sched.facility_name || 'TBD'}</td>
                  <td>
                    {sched.has_conflict ? (
                      <span className="badge badge-error">Conflict</span>
                    ) : sched.is_published ? (
                      <span className="badge badge-success">Published</span>
                    ) : (
                      <span className="badge badge-warning">Draft</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => togglePublish(sched.id, sched.is_published)}
                      >
                        {sched.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleDelete(sched.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Event Details</h2>
              <button className="modal-close" onClick={() => setSelectedEvent(null)}>&times;</button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Event</div>
                <div style={{ fontWeight: 600 }}>{selectedEvent.title}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Type</div>
                <span className="badge" style={{ 
                  background: selectedEvent.event_type === 'game' ? '#dbeafe' : '#fce7f3',
                  color: selectedEvent.event_type === 'game' ? '#1e40af' : '#9d174d'
                }}>
                  {selectedEvent.event_type}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Date & Time</div>
                <div>{formatDate(selectedEvent.start_time)}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Teams</div>
                <div>{selectedEvent.home_team_name || 'TBD'}{selectedEvent.away_team_name && ` vs ${selectedEvent.away_team_name}`}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Facility</div>
                <div>{selectedEvent.facility_name || 'TBD'}</div>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>Status</div>
                {selectedEvent.has_conflict ? (
                  <span className="badge badge-error">Conflict</span>
                ) : selectedEvent.is_published ? (
                  <span className="badge badge-success">Published</span>
                ) : (
                  <span className="badge badge-warning">Draft</span>
                )}
              </div>
              {selectedEvent.is_published === 1 && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                  <button 
                    className="btn btn-secondary" 
                    style={{ width: '100%' }}
                    onClick={() => notifyParents(selectedEvent)}
                    disabled={notifying}
                  >
                    {notifying ? 'Sending...' : '📧 Notify Parents'}
                  </button>
                  <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', marginTop: '0.5rem', textAlign: 'center' }}>
                    Send email notification to parents of affected players
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
