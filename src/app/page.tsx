import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <div className="header">
        <h1 className="title">🏈 GameOn Scheduler</h1>
      </div>
      
      <nav className="nav">
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
          Welcome to GameOn Scheduler
        </h2>
        <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>
          Simplify youth sports scheduling for your league. Manage facilities, teams, and generate schedules in minutes.
        </p>
        
        <div className="grid grid-3" style={{ marginTop: '1.5rem' }}>
          <Link href="/facilities" className="card" style={{ display: 'block' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>🏟️ Facilities</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
              Add fields, courts, and gyms with availability windows
            </p>
          </Link>
          
          <Link href="/teams" className="card" style={{ display: 'block' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>👥 Teams</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
              Manage teams, players, and coaches
            </p>
          </Link>
          
          <Link href="/schedule" className="card" style={{ display: 'block' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>📅 Schedule</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--secondary)' }}>
              Generate and manage game schedules
            </p>
          </Link>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>
          Quick Start
        </h2>
        <ol style={{ paddingLeft: '1.25rem', color: 'var(--secondary)' }}>
          <li style={{ marginBottom: '0.5rem' }}>Add your facilities (fields, courts, gyms)</li>
          <li style={{ marginBottom: '0.5rem' }}>Add your teams and rosters</li>
          <li style={{ marginBottom: '0.5rem' }}>Set your scheduling preferences</li>
          <li style={{ marginBottom: '0.5rem' }}>Generate a schedule with one click</li>
        </ol>
      </div>
    </div>
  );
}
