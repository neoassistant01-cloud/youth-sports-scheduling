'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegistrations } from '@/context/RegistrationContext';

export default function RegistrationsPage() {
  const { registrations } = useRegistrations();
  const [searchQuery, setSearchQuery] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  const sports = Array.from(new Set(registrations.map(r => r.sport))).sort();

  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = !searchQuery || 
      reg.childName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSport = !sportFilter || reg.sport === sportFilter;
    return matchesSearch && matchesSport;
  });

  return (
    <div>
      <div className="header">
        <h1 className="title">📋 Registration Management</h1>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/registration" className="nav-link">Register</Link>
        <Link href="/registrations" className="nav-link active">Admin</Link>
      </nav>

      {registrations.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <p>No registrations yet.</p>
            <Link href="/registration" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Go to Registration Form
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label">Search</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by child, parent, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div style={{ minWidth: '150px' }}>
                <label className="form-label">Filter by Sport</label>
                <select
                  className="form-select"
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                >
                  <option value="">All Sports</option>
                  {sports.map(sport => (
                    <option key={sport} value={sport}>{sport}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: '0.75rem', color: 'var(--secondary)' }}>
              Showing {filteredRegistrations.length} of {registrations.length} registrations
            </div>
          </div>

          <div className="stats-row" style={{ marginBottom: '1rem' }}>
            <div className="stat-card">
              <div className="stat-value">{registrations.length}</div>
              <div className="stat-label">Total</div>
            </div>
            {sports.slice(0, 4).map(sport => (
              <div key={sport} className="stat-card">
                <div className="stat-value">{registrations.filter(r => r.sport === sport).length}</div>
                <div className="stat-label">{sport}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Child</th>
                  <th>Parent</th>
                  <th>Contact</th>
                  <th>Sport</th>
                  <th>Emergency</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map(reg => (
                  <tr key={reg.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {reg.createdAt.toLocaleDateString()}
                    </td>
                    <td>
                      <strong>{reg.childName}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                        {reg.childGrade}
                      </div>
                    </td>
                    <td>{reg.parentName}</td>
                    <td>
                      <div style={{ fontSize: '0.875rem' }}>{reg.email}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>{reg.phone}</div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{reg.sport}</span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{reg.emergencyContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
