'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Preference {
  key: string;
  value: string;
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    weekdayEveningStart: '16:00',
    weekdayEveningEnd: '21:00',
    weekendMorningStart: '08:00',
    weekendAfternoonEnd: '15:00',
    restDaysRequired: '1',
    maxGamesPerDay: '2'
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setPreferences(data);
      
      // Map to form
      const prefMap: Record<string, string> = {};
      data.forEach((p: Preference) => { prefMap[p.key] = p.value; });
      
      setFormData({
        weekdayEveningStart: prefMap['weekday_evening_start'] || '16:00',
        weekdayEveningEnd: prefMap['weekday_evening_end'] || '21:00',
        weekendMorningStart: prefMap['weekend_morning_start'] || '08:00',
        weekendAfternoonEnd: prefMap['weekend_afternoon_end'] || '15:00',
        restDaysRequired: prefMap['rest_days_required'] || '1',
        maxGamesPerDay: prefMap['max_games_per_day'] || '2'
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      alert('Settings saved!');
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="header">
        <h1 className="title">⚙️ Settings</h1>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link active">Settings</Link>
      </nav>

      <div className="card">
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Scheduling Preferences</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Weekday Evening Start</label>
              <input
                type="time"
                className="form-input"
                value={formData.weekdayEveningStart}
                onChange={e => setFormData({ ...formData, weekdayEveningStart: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Weekday Evening End</label>
              <input
                type="time"
                className="form-input"
                value={formData.weekdayEveningEnd}
                onChange={e => setFormData({ ...formData, weekdayEveningEnd: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Weekend Morning Start</label>
              <input
                type="time"
                className="form-input"
                value={formData.weekendMorningStart}
                onChange={e => setFormData({ ...formData, weekendMorningStart: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Weekend Afternoon End</label>
              <input
                type="time"
                className="form-input"
                value={formData.weekendAfternoonEnd}
                onChange={e => setFormData({ ...formData, weekendAfternoonEnd: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Rest Days Required Between Games</label>
              <input
                type="number"
                className="form-input"
                min="0"
                max="7"
                value={formData.restDaysRequired}
                onChange={e => setFormData({ ...formData, restDaysRequired: e.target.value })}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Max Games Per Day Per Team</label>
              <input
                type="number"
                className="form-input"
                min="1"
                max="5"
                value={formData.maxGamesPerDay}
                onChange={e => setFormData({ ...formData, maxGamesPerDay: e.target.value })}
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>Export Options</h3>
        <p style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>
          Export your schedule to share with coaches and parents.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/api/export/csv'}>
            📥 Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => window.location.href = '/api/export/ics'}>
            📅 Export Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
