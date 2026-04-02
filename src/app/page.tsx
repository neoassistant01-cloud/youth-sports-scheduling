'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Schedule {
  id: number;
  facility_id: number;
  home_team_id: number;
  away_team_id: number | null;
  event_type: string;
  title: string;
  start_time: number;
  is_published: number;
}

interface Team {
  id: number;
  name: string;
}

interface Facility {
  id: number;
  name: string;
}

interface Player {
  id: number;
  team_id: number;
}

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [schedRes, teamRes, facRes, playerRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/teams'),
          fetch('/api/facilities'),
          fetch('/api/players')
        ]);
        setSchedules(await schedRes.json());
        setTeams(await teamRes.json());
        setFacilities(await facRes.json());
        setPlayers(await playerRes.json());
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const now = Date.now();
  const upcomingSchedules = schedules
    .filter(s => s.start_time > now)
    .sort((a, b) => a.start_time - b.start_time)
    .slice(0, 5);

  const publishedCount = schedules.filter(s => s.is_published).length;
  const draftCount = schedules.length - publishedCount;
  const totalPlayers = players.length;

  function getTeamName(teamId: number) {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'TBD';
  }

  function getFacilityName(facilityId: number) {
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name || 'TBD';
  }

  function formatDate(timestamp: number) {
    const date = new Date(timestamp);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    };
  }

  if (loading) return <div className="loading">Loading dashboard...</div>;

  return (
    <div>
      <div className="header">
        <h1 className="title">🏈 GameOn Scheduler</h1>
      </div>
      
      <nav className="nav">
        <Link href="/" className="nav-link active">Home</Link>
        <Link href="/registration" className="nav-link">Register</Link>
        <Link href="/registrations" className="nav-link">Admin</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/players" className="nav-link">Players</Link>
        <Link href="/coaches" className="nav-link">Coaches</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/analytics" className="nav-link">Analytics</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {/* Stats Dashboard */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>📅</div>
          <div>
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">Total Events</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7', color: '#166534' }}>✓</div>
          <div>
            <div className="stat-value">{publishedCount}</div>
            <div className="stat-label">Published</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>📝</div>
          <div>
            <div className="stat-value">{draftCount}</div>
            <div className="stat-label">Drafts</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#9d174d' }}>👥</div>
          <div>
            <div className="stat-value">{teams.length}</div>
            <div className="stat-label">Teams</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>🏃</div>
          <div>
            <div className="stat-value">{totalPlayers}</div>
            <div className="stat-label">Players</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f1f5f9', color: '#475569' }}>🏟️</div>
          <div>
            <div className="stat-value">{facilities.length}</div>
            <div className="stat-label">Facilities</div>
          </div>
        </div>
      </div>

      {/* Quick Registration CTA */}
      <div className="card dashboard-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>🏃 Ready to Play?</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>
          Register your child for youth sports today!
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/registration" className="btn" style={{ background: 'white', color: '#667eea' }}>
            Start Registration →
          </Link>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Upcoming Games Dashboard */}
        <div className="card dashboard-card">
          <div className="dashboard-header">
            <h2>📅 Upcoming Events</h2>
            <Link href="/schedule" className="view-all-link">View All →</Link>
          </div>
          
          {upcomingSchedules.length === 0 ? (
            <div className="empty-state" style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '0.75rem' }}>No upcoming events scheduled.</p>
              <Link href="/schedule" className="btn btn-primary" style={{ fontSize: '0.875rem' }}>
                Create Schedule
              </Link>
            </div>
          ) : (
            <div className="upcoming-list">
              {upcomingSchedules.map(sched => {
                const dateInfo = formatDate(sched.start_time);
                return (
                  <div key={sched.id} className="upcoming-item">
                    <div className="upcoming-date">
                      <span className="upcoming-day">{dateInfo.day}</span>
                      <span className="upcoming-time">{dateInfo.time}</span>
                    </div>
                    <div className="upcoming-details">
                      <div className="upcoming-title">{sched.title}</div>
                      <div className="upcoming-meta">
                        <span>📍 {getFacilityName(sched.facility_id)}</span>
                      </div>
                    </div>
                    <div className="upcoming-status">
                      <span className="badge" style={{ 
                        background: sched.event_type === 'game' ? '#dbeafe' : '#fce7f3',
                        color: sched.event_type === 'game' ? '#1e40af' : '#9d174d',
                        fontSize: '0.6875rem'
                      }}>
                        {sched.event_type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Stats / Activity */}
        <div className="card dashboard-card">
          <div className="dashboard-header">
            <h2>📊 Program Overview</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Teams</span>
              <span style={{ fontWeight: 600 }}>{teams.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Players Registered</span>
              <span style={{ fontWeight: 600 }}>{totalPlayers}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Published Events</span>
              <span style={{ fontWeight: 600, color: '#166534' }}>{publishedCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Draft Events</span>
              <span style={{ fontWeight: 600, color: '#92400e' }}>{draftCount}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '8px' }}>
              <span style={{ color: '#64748b' }}>Facilities</span>
              <span style={{ fontWeight: 600 }}>{facilities.length}</span>
            </div>
          </div>

          {teams.length === 0 && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef3c7', borderRadius: '8px', fontSize: '0.875rem' }}>
              <strong>Get started:</strong> Add teams and facilities to begin scheduling.
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1.125rem', fontWeight: 600 }}>Quick Actions</h3>
      <div className="quick-actions">
        <Link href="/registration" className="card action-card">
          <h3>📝 Register</h3>
          <p>Sign up your child for sports</p>
        </Link>
        
        <Link href="/teams" className="card action-card">
          <h3>👥 Teams</h3>
          <p>Manage teams and rosters</p>
        </Link>
        
        <Link href="/facilities" className="card action-card">
          <h3>🏟️ Facilities</h3>
          <p>Add fields, courts, and gyms</p>
        </Link>
        
        <Link href="/schedule" className="card action-card">
          <h3>📅 Schedule</h3>
          <p>Generate game schedules</p>
        </Link>

        <Link href="/analytics" className="card action-card">
          <h3>📊 Analytics</h3>
          <p>View stats and insights</p>
        </Link>

        <Link href="/settings" className="card action-card">
          <h3>⚙️ Settings</h3>
          <p>Configure preferences</p>
        </Link>
      </div>
    </div>
  );
}
