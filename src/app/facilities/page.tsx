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

export default function FacilitiesPage() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    capacity: '',
    surfaceType: '',
    hasLighting: false,
    notes: ''
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

  if (loading) {
    return <div>Loading...</div>;
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
        <Link href="/schedule" className="nav-link">Schedule</Link>
        <Link href="/settings" className="nav-link">Settings</Link>
      </nav>

      {facilities.length === 0 ? (
        <div className="empty-state">
          <p>No facilities yet. Add your first facility to get started!</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {facilities.map(facility => (
            <div key={facility.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{facility.name}</h3>
                  {facility.address && <p style={{ fontSize: '0.875rem', color: 'var(--secondary)', marginBottom: '0.5rem' }}>{facility.address}</p>}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => openEdit(facility)}>Edit</button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDelete(facility.id)}>Delete</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                {facility.surface_type && <span className="badge badge-success">{facility.surface_type}</span>}
                {facility.capacity && <span className="badge badge-warning">Capacity: {facility.capacity}</span>}
                {facility.has_lighting ? <span className="badge badge-success">Lighting</span> : <span className="badge badge-warning">No Lighting</span>}
              </div>
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
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Capacity</label>
                <input
                  type="number"
                  className="form-input"
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
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formData.hasLighting}
                    onChange={e => setFormData({ ...formData, hasLighting: e.target.checked })}
                  />
                  Has Lighting
                </label>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingFacility ? 'Update' : 'Add'} Facility</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
