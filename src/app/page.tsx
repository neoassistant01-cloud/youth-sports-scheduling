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

export default function Home() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [schedRes, teamRes, facRes] = await Promise.all([
          fetch('/api/schedules'),
          fetch('/api/teams'),
          fetch('/api/facilities')
        ]);
        setSchedules(await schedRes.json());
        setTeams(await teamRes.json());
        setFacilities(await facRes.json());
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

  function getTeamName(teamId: number) {
    const team = teams.find(t => t.id === teamId);
    return team?.name || 'TBD';
  }

  function getFacilityName(facilityId: number) {
    const facility = facilities.find(f => f.id === facilityId);
    return facility?.name || 'TBD';
  }

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <div className="header">
        <h1 className="title">🏈 GameOn Scheduler</h1>
      </div>
      
      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
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
          <div className="stat-value">{schedules.length}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{publishedCount}</div>
          <div className="stat-label">Published</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{teams.length}</div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{facilities.length}</div>
          <div className="stat-label">Facilities</div>
        </div>
      </div>

      {/* Quick Registration CTA */}
      <div className="card dashboard-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <h2>🏃 Ready to Play?</h2>
        <p style={{ marginTop: '0.5rem', opacity: 0.9 }}>
          Register your child for youth sports today!
        </p>
        <div style={{ marginTop: '1rem' }}>
          <Link href="/registration" className="btn" style={{ background: 'white', color: '#667eea' }}>
            Start Registration →
          </Link>
        </div>
      </div>

      {/* Upcoming Games Dashboard */}
      <div className="card dashboard-card">
        <div className="dashboard-header">
          <h2>📅 Upcoming Games</h2>
          <Link href="/schedule" className="view-all-link">View All →</Link>
        </div>
        
        {upcomingSchedules.length === 0 ? (
          <div className="empty-state">
            <p>No upcoming games scheduled.</p>
            <Link href="/schedule" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Create Schedule
            </Link>
          </div>
        ) : (
          <div className="upcoming-list">
            {upcomingSchedules.map(sched => (
              <div key={sched.id} className="upcoming-item">
                <div className="upcoming-date">
                  <span className="upcoming-day">{new Date(sched.start_time).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  <span className="upcoming-time">{new Date(sched.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                </div>
                <div className="upcoming-details">
                  <div className="upcoming-title">{sched.title}</div>
                  <div className="upcoming-meta">
                    <span>📍 {getFacilityName(sched.facility_id)}</span>
                    <span className="badge" style={{ 
                      background: sched.event_type === 'game' ? '#dbeafe' : '#fce7f3',
                      color: sched.event_type === 'game' ? '#1e40af' : '#9d174d',
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem'
                    }}>
                      {sched.event_type}
                    </span>
                  </div>
                </div>
                <div className="upcoming-status">
                  {sched.is_published ? (
                    <span className="badge badge-success">Published</span>
                  ) : (
                    <span className="badge badge-warning">Draft</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link href="/registration" className="card action-card">
          <h3>📝 Register</h3>
          <p>Sign up your child for sports</p>
        </Link>
        
        <Link href="/facilities" className="card action-card">
          <h3>🏟️ Facilities</h3>
          <p>Add fields, courts, and gyms</p>
        </Link>
        
        <Link href="/teams" className="card action-card">
          <h3>👥 Teams</h3>
          <p>Manage teams and rosters</p>
        </Link>
        
        <Link href="/schedule" className="card action-card">
          <h3>📅 Schedule</h3>
          <p>Generate game schedules</p>
        </Link>

        <Link href="/analytics" className="card action-card">
          <h3>📊 Analytics</h3>
          <p>View stats and insights</p>
        </Link>
      </div>
    </div>
  );
}
