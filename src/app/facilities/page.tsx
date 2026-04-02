'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Facility {
  id: number;
  name: string;
  address: string | null;
  capacity: number | null;
  surface_type: string | null;
  has_lighting: number;
  notes: string | null;
}

interface AvailabilityRule {
  id: number;
  facility_id: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_active: number;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedFacilityRules, setSelectedFacilityRules] = useState<AvailabilityRule[]>([]);
  const [selectedFacilityForRules, setSelectedFacilityForRules] = useState<Facility | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSurface, setFilterSurface] = useState<string>('');
  const [filterLighting, setFilterLighting] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    surfaceType: '',
    hasLighting: false,
    notes: ''
  });
  const [ruleForm, setRuleForm] = useState({
    dayOfWeek: 'saturday',
    startTime: '08:00',
    endTime: '15:00'
  });

  useEffect(() => {
    fetchFacilities();
  }, []);

  async function fetchFacilities() {
    try {
      const res = await fetch('/api/facilities');
      const data = await res.json();
      setFacilities(data);
    } catch (error) {
      console.error('Error fetching facilities:', error);
    } finally {
      setLoading(false);
    }
  }

  async function openAvailabilityRules(facility: Facility) {
    setSelectedFacilityForRules(facility);
    try {
      const res = await fetch(`/api/facilities/${facility.id}/availability`);
      const rules = await res.json();
      setSelectedFacilityRules(rules);
      setShowAvailabilityModal(true);
    } catch (error) {
      console.error('Error fetching availability rules:', error);
    }
  }

  async function handleAddRule() {
    if (!selectedFacilityForRules) return;
    try {
      const res = await fetch(`/api/facilities/${selectedFacilityForRules.id}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm)
      });
      if (res.ok) {
        const updated = await fetch(`/api/facilities/${selectedFacilityForRules.id}/availability`);
        const rules = await updated.json();
        setSelectedFacilityRules(rules);
        setRuleForm({ dayOfWeek: 'saturday', startTime: '08:00', endTime: '15:00' });
      }
    } catch (error) {
      console.error('Error adding rule:', error);
    }
  }

  async function handleToggleRule(rule: AvailabilityRule) {
    try {
      await fetch(`/api/facilities/${rule.id}/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !rule.is_active })
      });
      const updated = await fetch(`/api/facilities/${selectedFacilityForRules?.id}/availability`);
      const rules = await updated.json();
      setSelectedFacilityRules(rules);
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  }

  async function handleDeleteRule(ruleId: number) {
    try {
      await fetch(`/api/facilities/${ruleId}/availability`, { method: 'DELETE' });
      setSelectedFacilityRules(prev => prev.filter(r => r.id !== ruleId));
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const url = editingFacility ? `/api/facilities/${editingFacility.id}` : '/api/facilities';
    const method = editingFacility ? 'PUT' : 'POST';
    
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', address: '', capacity: '', surfaceType: '', hasLighting: false, notes: '' });
        setEditingFacility(null);
        fetchFacilities();
      }
    } catch (error) {
      console.error('Error saving facility:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this facility?')) return;
    
    try {
      await fetch(`/api/facilities/${id}`, { method: 'DELETE' });
      fetchFacilities();
    } catch (error) {
      console.error('Error deleting facility:', error);
    }
  }

  function openEdit(facility: Facility) {
    setEditingFacility(facility);
    setFormData({
      name: facility.name,
      address: facility.address || '',
      capacity: facility.capacity?.toString() || '',
      surfaceType: facility.surface_type || '',
      hasLighting: !!facility.has_lighting,
      notes: facility.notes || ''
    });
    setShowModal(true);
  }

  function getSurfaceIcon(surface: string | null) {
    switch(surface) {
      case 'turf': return '🌿';
      case 'grass': return '🌱';
      case 'hardwood': return '🏀';
      case 'synthetic': return '💎';
      case 'clay': return '🟤';
      default: return '📍';
    }
  }

  const filteredFacilities = facilities.filter(facility => {
    const matchesSearch = !searchQuery || 
      facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (facility.address && facility.address.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSurface = !filterSurface || facility.surface_type === filterSurface;
    const matchesLighting = !filterLighting || 
      (filterLighting === 'yes' && facility.has_lighting) ||
      (filterLighting === 'no' && !facility.has_lighting);
    return matchesSearch && matchesSurface && matchesLighting;
  });

  const totalCapacity = facilities.reduce((sum, f) => sum + (f.capacity || 0), 0);
  const facilitiesWithLighting = facilities.filter(f => f.has_lighting).length;

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1 className="title">🏟️ Facilities</h1>
        <button className="btn btn-primary" onClick={() => { setEditingFacility(null); setFormData({ name: '', address: '', capacity: '', surfaceType: '', hasLighting: false, notes: '' }); setShowModal(true); }}>
          + Add Facility
        </button>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/facilities" className="nav-link active">Facilities</Link>
        <Link href="/teams" className="nav-link">Teams</Link>
        <Link href="/players" className="nav-link">Players</Link>
        <Link href="/coaches" className="nav-link">Coaches</Link>
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {facilities.length > 0 && (
        <div className="stats-row" style={{ marginBottom: '1.5rem' }}>
          <div className="stat-card">
            <div className="stat-value">{facilities.length}</div>
            <div className="stat-label">Total Facilities</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalCapacity}</div>
            <div className="stat-label">Total Capacity</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{facilitiesWithLighting}</div>
            <div className="stat-label">With Lighting</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{facilities.filter(f => f.surface_type === 'turf').length}</div>
            <div className="stat-label">Turf Fields</div>
          </div>
        </div>
      )}

      {facilities.length > 0 && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search facilities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterSurface}
            onChange={(e) => setFilterSurface(e.target.value)}
          >
            <option value="">All Surfaces</option>
            <option value="grass">Grass</option>
            <option value="turf">Turf</option>
            <option value="hardwood">Hardwood</option>
            <option value="synthetic">Synthetic</option>
            <option value="clay">Clay</option>
          </select>
          <select 
            className="form-select" 
            style={{ width: 'auto', minWidth: '150px' }}
            value={filterLighting}
            onChange={(e) => setFilterLighting(e.target.value)}
          >
            <option value="">Lighting</option>
            <option value="yes">Has Lighting</option>
            <option value="no">No Lighting</option>
          </select>
        </div>
      )}

      {facilities.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏟️</div>
          <div className="empty-state-title">No Facilities Yet</div>
          <p>Add your first facility to get started with scheduling!</p>
        </div>
      ) : filteredFacilities.length === 0 ? (
        <div className="empty-state">
          <p>No facilities match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: '1rem' }}>
          {filteredFacilities.map(facility => (
            <div key={facility.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ 
                    width: '2.5rem', 
                    height: '2.5rem', 
                    borderRadius: 'var(--radius)', 
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem'
                  }}>
                    {getSurfaceIcon(facility.surface_type)}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: '1.125rem', marginBottom: '0.125rem' }}>{facility.name}</h3>
                    {facility.address && <p style={{ fontSize: '0.8125rem', color: 'var(--secondary)' }}>{facility.address}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button className="btn btn-ghost" style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem' }} onClick={() => openEdit(facility)}>Edit</button>
                  <button className="btn btn-ghost" style={{ padding: '0.375rem 0.625rem', fontSize: '0.8125rem', color: 'var(--error)' }} onClick={() => handleDelete(facility.id)}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {facility.surface_type && (
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>
                    {facility.surface_type}
                  </span>
                )}
                {facility.capacity && (
                  <span className="badge badge-secondary">
                    👥 {facility.capacity}
                  </span>
                )}
                {facility.has_lighting ? (
                  <span className="badge badge-success">💡 Lighting</span>
                ) : (
                  <span className="badge badge-warning">🌙 No Lighting</span>
                )}
              </div>
              <button 
                className="btn btn-ghost" 
                style={{ marginTop: '0.75rem', fontSize: '0.8125rem', width: '100%', justifyContent: 'center' }}
                onClick={() => openAvailabilityRules(facility)}
              >
                🕐 Set Availability Rules
              </button>
              {facility.notes && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--secondary)', marginTop: '0.75rem', fontStyle: 'italic' }}>
                  {facility.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingFacility ? 'Edit Facility' : 'Add Facility'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., Main Field, gymnasium A"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Street address"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Capacity</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Max players"
                    value={formData.capacity}
                    onChange={e => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Surface Type</label>
                  <select
                    className="form-select"
                    value={formData.surfaceType}
                    onChange={e => setFormData({ ...formData, surfaceType: e.target.value })}
                  >
                    <option value="">Select...</option>
                    <option value="grass">Grass</option>
                    <option value="turf">Turf</option>
                    <option value="hardwood">Hardwood</option>
                    <option value="synthetic">Synthetic</option>
                    <option value="clay">Clay</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasLighting}
                    onChange={e => setFormData({ ...formData, hasLighting: e.target.checked })}
                  />
                  <span>Has Lighting</span>
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Any additional notes about this facility..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingFacility ? 'Update' : 'Add'} Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAvailabilityModal && (
        <div className="modal-overlay" onClick={() => setShowAvailabilityModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">🕐 {selectedFacilityForRules?.name}</h2>
              <button className="modal-close" onClick={() => setShowAvailabilityModal(false)}>&times;</button>
            </div>
            <div style={{ padding: '1rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
                Set when this facility is available for scheduling. Leave times empty to make the facility unavailable.
              </p>
              
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Add Availability Rule</h4>
                <div className="grid grid-3" style={{ gap: '0.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Day</label>
                    <select
                      className="form-select"
                      value={ruleForm.dayOfWeek}
                      onChange={e => setRuleForm({ ...ruleForm, dayOfWeek: e.target.value })}
                    >
                      {DAYS_OF_WEEK.map(day => (
                        <option key={day} value={day} style={{ textTransform: 'capitalize' }}>{day}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Start</label>
                    <input
                      type="time"
                      className="form-input"
                      value={ruleForm.startTime}
                      onChange={e => setRuleForm({ ...ruleForm, startTime: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">End</label>
                    <input
                      type="time"
                      className="form-input"
                      value={ruleForm.endTime}
                      onChange={e => setRuleForm({ ...ruleForm, endTime: e.target.value })}
                    />
                  </div>
                </div>
                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  onClick={handleAddRule}
                >
                  + Add Rule
                </button>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {selectedFacilityRules.length === 0 ? (
                  <div className="empty-state">
                    <p>No availability rules set. This facility will be available at all times.</p>
                  </div>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Day</th>
                        <th>Time</th>
                        <th>Status</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedFacilityRules.map(rule => (
                        <tr key={rule.id}>
                          <td style={{ textTransform: 'capitalize' }}>{rule.day_of_week}</td>
                          <td>{rule.start_time} - {rule.end_time}</td>
                          <td>
                            <button 
                              className={`btn ${rule.is_active ? 'btn-primary' : 'btn-ghost'}`}
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleToggleRule(rule)}
                            >
                              {rule.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td>
                            <button 
                              className="btn btn-danger"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleDeleteRule(rule.id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
