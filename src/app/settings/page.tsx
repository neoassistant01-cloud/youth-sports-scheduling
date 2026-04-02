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

  // Notification preferences (stored in preferences table)
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: 'true',
    scheduleNotifications: 'true',
    practiceNotifications: 'true',
    reminderHours: '24'
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

      // Load notification preferences
      setNotificationPrefs({
        emailEnabled: prefMap['email_enabled'] || 'true',
        scheduleNotifications: prefMap['notify_schedule'] || 'true',
        practiceNotifications: prefMap['notify_practice'] || 'true',
        reminderHours: prefMap['reminder_hours'] || '24'
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
      // Combine scheduling + notification preferences
      const allPrefs = {
        ...formData,
        email_enabled: notificationPrefs.emailEnabled,
        notify_schedule: notificationPrefs.scheduleNotifications,
        notify_practice: notificationPrefs.practiceNotifications,
        reminder_hours: notificationPrefs.reminderHours
      };
      
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allPrefs)
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
        <Link href="/players" className="nav-link">Players</Link>
        <Link href="/coaches" className="nav-link">Coaches</Link>
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
        <h3 style={{ fontWeight: 600, marginBottom: '1rem' }}>📧 Parent Communication</h3>
        <p style={{ color: 'var(--secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Configure how parents receive schedule updates. In production, this would integrate with email services.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={notificationPrefs.emailEnabled === 'true'}
                onChange={e => setNotificationPrefs({ ...notificationPrefs, emailEnabled: e.target.checked ? 'true' : 'false' })}
              />
              <span>Enable email notifications to parents</span>
            </label>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={notificationPrefs.scheduleNotifications === 'true'}
                onChange={e => setNotificationPrefs({ ...notificationPrefs, scheduleNotifications: e.target.checked ? 'true' : 'false' })}
              />
              <span>Notify on game schedule changes</span>
            </label>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={notificationPrefs.practiceNotifications === 'true'}
                onChange={e => setNotificationPrefs({ ...notificationPrefs, practiceNotifications: e.target.checked ? 'true' : 'false' })}
              />
              <span>Notify on practice schedule changes</span>
            </label>
          </div>
          
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>Send reminder before event</label>
            <select 
              className="form-select"
              style={{ maxWidth: '200px' }}
              value={notificationPrefs.reminderHours}
              onChange={e => setNotificationPrefs({ ...notificationPrefs, reminderHours: e.target.value })}
            >
              <option value="1">1 hour</option>
              <option value="2">2 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours (1 day)</option>
              <option value="48">48 hours (2 days)</option>
            </select>
          </div>
        </div>
        
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px', fontSize: '0.75rem', color: '#92400e' }}>
          <strong>Note:</strong> This is a stub implementation. In production, integrate with SendGrid, Mailgun, or similar email service to actually deliver notifications to parents.
        </div>
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
