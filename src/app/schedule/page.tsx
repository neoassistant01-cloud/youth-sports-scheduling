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

interface EditForm {
  title: string;
  eventType: string;
  facilityId: number;
  homeTeamId: number;
  awayTeamId: number | null;
  startTime: string;
  endTime: string;
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
  const [editingEvent, setEditingEvent] = useState<Schedule | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '',
    eventType: 'practice',
    facilityId: 0,
    homeTeamId: 0,
    awayTeamId: null,
    startTime: '',
    endTime: ''
  });
  const [saving, setSaving] = useState(false);

  // Quick add form state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    title: '',
    eventType: 'practice',
    facilityId: 0,
    homeTeamId: 0,
    awayTeamId: null as number | null,
    date: '',
    startTime: '',
    endTime: ''
  });
  const [quickAdding, setQuickAdding] = useState(false);
  const [quickAddError, setQuickAddError] = useState('');

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

  async function handleQuickAdd() {
    setQuickAddError('');
    
    if (!quickAddForm.title.trim()) {
      setQuickAddError('Please enter an event title');
      return;
    }
    if (!quickAddForm.facilityId) {
      setQuickAddError('Please select a facility');
      return;
    }
    if (!quickAddForm.homeTeamId) {
      setQuickAddError('Please select a home team');
      return;
    }
    if (!quickAddForm.date || !quickAddForm.startTime || !quickAddForm.endTime) {
      setQuickAddError('Please fill in all date and time fields');
      return;
    }

    const startDateTime = new Date(`${quickAddForm.date}T${quickAddForm.startTime}`);
    const endDateTime = new Date(`${quickAddForm.date}T${quickAddForm.endTime}`);

    if (endDateTime <= startDateTime) {
      setQuickAddError('End time must be after start time');
      return;
    }

    setQuickAdding(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quickAddForm.title,
          eventType: quickAddForm.eventType,
          facilityId: quickAddForm.facilityId,
          homeTeamId: quickAddForm.homeTeamId,
          awayTeamId: quickAddForm.awayTeamId,
          startTime: startDateTime.getTime(),
          endTime: endDateTime.getTime(),
          isPublished: false
        })
      });

      if (res.ok) {
        setShowQuickAdd(false);
        setQuickAddForm({
          title: '',
          eventType: 'practice',
          facilityId: 0,
          homeTeamId: 0,
          awayTeamId: null,
          date: '',
          startTime: '',
          endTime: ''
        });
        loadData();
      } else {
        const data = await res.json();
        setQuickAddError(data.error || 'Failed to create event');
      }
    } catch (error) {
      setQuickAddError('Failed to create event');
    } finally {
      setQuickAdding(false);
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

  function startEdit(event: Schedule) {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);
    setEditForm({
      title: event.title,
      eventType: event.event_type,
      facilityId: event.facility_id,
      homeTeamId: event.home_team_id,
      awayTeamId: event.away_team_id,
      startTime: formatDateTimeLocal(startDate),
      endTime: formatDateTimeLocal(endDate)
    });
    setEditingEvent(event);
  }

  function formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async function saveEdit() {
    if (!editingEvent) return;
    setSaving(true);
    try {
      const startTime = new Date(editForm.startTime).getTime();
      const endTime = new Date(editForm.endTime).getTime();
      
      await fetch(`/api/schedules/${editingEvent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          eventType: editForm.eventType,
          facilityId: editForm.facilityId,
          homeTeamId: editForm.homeTeamId,
          awayTeamId: editForm.awayTeamId,
          startTime,
          endTime
        })
      });
      setEditingEvent(null);
      loadData();
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
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

      {/* Quick Add Section */}
      <div className="card" style={{ marginBottom: '1rem', border: '2px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: showQuickAdd ? '1rem' : 0 }}>
          <h3 style={{ fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ Quick Add Event
          </h3>
          <button 
            className="btn btn-primary" 
            style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem' }}
            onClick={() => setShowQuickAdd(!showQuickAdd)}
          >
            {showQuickAdd ? '− Hide' : '+ Show'}
          </button>
        </div>

        {showQuickAdd && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Event Title *</label>
              <input 
                type="text" 
                className="form-input"
                placeholder="e.g., Friday Practice"
                value={quickAddForm.title}
                onChange={e => setQuickAddForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Type</label>
              <select 
                className="form-select"
                value={quickAddForm.eventType}
                onChange={e => setQuickAddForm(prev => ({ ...prev, eventType: e.target.value }))}
              >
                <option value="practice">Practice</option>
                <option value="game">Game</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Facility *</label>
              <select 
                className="form-select"
                value={quickAddForm.facilityId}
                onChange={e => setQuickAddForm(prev => ({ ...prev, facilityId: parseInt(e.target.value) || 0 }))}
              >
                <option value={0}>Select...</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Home Team *</label>
              <select 
                className="form-select"
                value={quickAddForm.homeTeamId}
                onChange={e => setQuickAddForm(prev => ({ ...prev, homeTeamId: parseInt(e.target.value) || 0, awayTeamId: parseInt(e.target.value) === prev.awayTeamId ? null : prev.awayTeamId }))}
              >
                <option value={0}>Select...</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Away Team</label>
              <select 
                className="form-select"
                value={quickAddForm.awayTeamId ?? ''}
                onChange={e => setQuickAddForm(prev => ({ ...prev, awayTeamId: e.target.value ? parseInt(e.target.value) : null }))}
              >
                <option value="">None</option>
                {teams.filter(t => t.id !== quickAddForm.homeTeamId).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Date *</label>
              <input 
                type="date" 
                className="form-input"
                value={quickAddForm.date}
                onChange={e => setQuickAddForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Start Time *</label>
              <input 
                type="time" 
                className="form-input"
                value={quickAddForm.startTime}
                onChange={e => setQuickAddForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">End Time *</label>
              <input 
                type="time" 
                className="form-input"
                value={quickAddForm.endTime}
                onChange={e => setQuickAddForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>
        )}

        {showQuickAdd && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleQuickAdd}
              disabled={quickAdding}
            >
              {quickAdding ? 'Creating...' : '✓ Create Event'}
            </button>
            {quickAddError && (
              <span style={{ color: 'var(--error)', fontSize: '0.875rem' }}>{quickAddError}</span>
            )}
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Generate Schedule</h3>
        
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label className="form-label" style={{ margin: 0 }}>Select Teams</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedTeams(teams.map(t => t.id))}>Select All</button>
              <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setSelectedTeams([])}>Clear</button>
            </div>
          </div>
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
          <h3 style={{ fontWeight: 600, margin: 0 }}>Scheduled Events ({schedules.length})</h3>
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
            <p>No schedules yet. Use Quick Add or Generate Schedule above.</p>
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
              {schedules.sort((a, b) => a.start_time - b.start_time).map(sched => (
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
      {selectedEvent && !editingEvent && (
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
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={() => startEdit(selectedEvent)}
                >
                  ✏️ Edit
                </button>
                {selectedEvent.is_published === 1 && (
                  <button 
                    className="btn btn-secondary" 
                    style={{ flex: 1 }}
                    onClick={() => notifyParents(selectedEvent)}
                    disabled={notifying}
                  >
                    {notifying ? 'Sending...' : '📧 Notify'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="modal-overlay" onClick={() => setEditingEvent(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Edit Event</h2>
              <button className="modal-close" onClick={() => setEditingEvent(null)}>&times;</button>
            </div>
            <div style={{ padding: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={editForm.title}
                  onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Event Type</label>
                <select 
                  className="form-select"
                  value={editForm.eventType}
                  onChange={e => setEditForm(prev => ({ ...prev, eventType: e.target.value }))}
                >
                  <option value="practice">Practice</option>
                  <option value="game">Game</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Facility</label>
                <select 
                  className="form-select"
                  value={editForm.facilityId}
                  onChange={e => setEditForm(prev => ({ ...prev, facilityId: parseInt(e.target.value) }))}
                >
                  {facilities.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Home Team</label>
                <select 
                  className="form-select"
                  value={editForm.homeTeamId}
                  onChange={e => setEditForm(prev => ({ ...prev, homeTeamId: parseInt(e.target.value) }))}
                >
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Away Team (optional)</label>
                <select 
                  className="form-select"
                  value={editForm.awayTeamId ?? ''}
                  onChange={e => setEditForm(prev => ({ ...prev, awayTeamId: e.target.value ? parseInt(e.target.value) : null }))}
                >
                  <option value="">None</option>
                  {teams.filter(t => t.id !== editForm.homeTeamId).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input"
                  value={editForm.startTime}
                  onChange={e => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">End Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input"
                  value={editForm.endTime}
                  onChange={e => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                  onClick={saveEdit}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                  onClick={() => setEditingEvent(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
