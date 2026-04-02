'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Stats {
  totalTeams: number;
  totalPlayers: number;
  totalCoaches: number;
  totalFacilities: number;
  totalSchedules: number;
  publishedSchedules: number;
  upcomingGames: number;
  teamsBySport: Record<string, number>;
  playersByTeam: Record<number, number>;
  schedulesByMonth: Record<string, number>;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [teamsRes, playersRes, coachesRes, facilitiesRes, schedulesRes] = await Promise.all([
          fetch('/api/teams'),
          fetch('/api/players'),
          fetch('/api/coaches'),
          fetch('/api/facilities'),
          fetch('/api/schedules')
        ]);

        const [teams, players, coaches, facilities, schedules] = await Promise.all([
          teamsRes.json(),
          playersRes.json(),
          coachesRes.json(),
          facilitiesRes.json(),
          schedulesRes.json()
        ]);

        // Group teams by sport
        const teamsBySport: Record<string, number> = {};
        teams.forEach((t: any) => {
          const sport = t.sport || 'Unspecified';
          teamsBySport[sport] = (teamsBySport[sport] || 0) + 1;
        });

        // Group players by team
        const playersByTeam: Record<number, number> = {};
        players.forEach((p: any) => {
          playersByTeam[p.team_id] = (playersByTeam[p.team_id] || 0) + 1;
        });

        // Group schedules by month
        const schedulesByMonth: Record<string, number> = {};
        const now = Date.now();
        schedules.forEach((s: any) => {
          const date = new Date(s.start_time);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          schedulesByMonth[monthKey] = (schedulesByMonth[monthKey] || 0) + 1;
        });

        const upcomingGames = schedules.filter((s: any) => s.start_time > now && s.is_published).length;

        setStats({
          totalTeams: teams.length,
          totalPlayers: players.length,
          totalCoaches: coaches.length,
          totalFacilities: facilities.length,
          totalSchedules: schedules.length,
          publishedSchedules: schedules.filter((s: any) => s.is_published).length,
          upcomingGames,
          teamsBySport,
          playersByTeam,
          schedulesByMonth
        });
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Error loading analytics</div>;

  const sports = Object.entries(stats.teamsBySport).sort((a, b) => b[1] - a[1]);
  const topTeams = Object.entries(stats.playersByTeam).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const months = Object.entries(stats.schedulesByMonth).sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div>
      <div className="header">
        <h1 className="title">📊 Analytics Dashboard</h1>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/registration" className="nav-link">Register</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {/* Key Metrics */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTeams}</div>
          <div className="stat-label">Teams</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalPlayers}</div>
          <div className="stat-label">Players</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalCoaches}</div>
          <div className="stat-label">Coaches</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalFacilities}</div>
          <div className="stat-label">Facilities</div>
        </div>
      </div>

      {/* Schedule Stats */}
      <div className="stats-row">
        <div className="stat-card" style={{ background: '#f0fdf4' }}>
          <div className="stat-value" style={{ color: '#166534' }}>{stats.upcomingGames}</div>
          <div className="stat-label" style={{ color: '#166534' }}>Upcoming Games</div>
        </div>
        <div className="stat-card" style={{ background: '#eff6ff' }}>
          <div className="stat-value" style={{ color: '#1e40af' }}>{stats.publishedSchedules}</div>
          <div className="stat-label" style={{ color: '#1e40af' }}>Published</div>
        </div>
        <div className="stat-card" style={{ background: '#fef3c7' }}>
          <div className="stat-value" style={{ color: '#92400e' }}>{stats.totalSchedules - stats.publishedSchedules}</div>
          <div className="stat-label" style={{ color: '#92400e' }}>Drafts</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Teams by Sport */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Teams by Sport</h3>
          {sports.length === 0 ? (
            <p style={{ color: 'var(--secondary)' }}>No teams data available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sports.map(([sport, count]) => (
                <div key={sport} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <span>{sport}</span>
                      <span style={{ fontWeight: 600 }}>{count}</span>
                    </div>
                    <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${(count / stats.totalTeams) * 100}%`,
                          background: '#3b82f6',
                          borderRadius: 4
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Teams by Roster */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Largest Rosters</h3>
          {topTeams.length === 0 ? (
            <p style={{ color: 'var(--secondary)' }}>No roster data available</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {topTeams.map(([teamId, count]) => (
                <div key={teamId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: '#f9fafb', borderRadius: 4 }}>
                  <span>Team #{teamId}</span>
                  <span style={{ fontWeight: 600, color: '#3b82f6' }}>{count} players</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Activity by Month */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Schedule Activity</h3>
        {months.length === 0 ? (
          <p style={{ color: 'var(--secondary)' }}>No schedule data available</p>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {months.map(([month, count]) => (
              <div key={month} style={{ padding: '0.5rem 1rem', background: '#f3f4f6', borderRadius: 6, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{month}</div>
                <div style={{ fontWeight: 600 }}>{count}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
