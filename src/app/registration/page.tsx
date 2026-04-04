'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRegistrations } from '@/context/RegistrationContext';

const SPORTS = [
  'Soccer',
  'Basketball',
  'Baseball',
  'Softball',
  'Football',
  'Volleyball',
  'Track & Field',
  'Wrestling',
  'Lacrosse',
  'Hockey'
];

const GRADES = [
  'Pre-K (3-4 years)',
  'Kindergarten',
  '1st Grade',
  '2nd Grade',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade'
];

export default function RegistrationPage() {
  const { addRegistration } = useRegistrations();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    parentName: '',
    email: '',
    phone: '',
    childName: '',
    childGrade: '',
    sport: '',
    emergencyContact: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRegistration(formData);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div>
        <div className="header">
          <h1 className="title">🎉 Registration Complete!</h1>
        </div>
        
        <nav className="nav">
          <Link href="/" className="nav-link">Home</Link>
          <Link href="/registration" className="nav-link active">Register</Link>
          <Link href="/registrations" className="nav-link">Admin</Link>
        </nav>

        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
          <h2>Thank You for Registering!</h2>
          <p style={{ color: 'var(--secondary)', marginTop: '0.5rem' }}>
            Your registration for <strong>{formData.childName}</strong> has been submitted successfully.
          </p>
          <p style={{ color: 'var(--secondary)' }}>
            We will contact you at <strong>{formData.email}</strong> with further information.
          </p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setSubmitted(false);
                setFormData({
                  parentName: '',
                  email: '',
                  phone: '',
                  childName: '',
                  childGrade: '',
                  sport: '',
                  emergencyContact: ''
                });
              }}
            >
              Register Another Child
            </button>
            <Link href="/" className="btn btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1 className="title">📝 Youth Sports Registration</h1>
      </div>

      <nav className="nav">
        <Link href="/" className="nav-link">Home</Link>
        <Link href="/registration" className="nav-link active">Register</Link>
        <Link href="/registrations" className="nav-link">Admin</Link>
      </nav>

      <div className="card">
        <p style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>
          Please fill out the form below to register your child for youth sports. Fields marked with * are required.
        </p>

        <form onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Parent/Guardian Information</h3>
          
          <div className="form-group">
            <label className="form-label">Parent/Guardian Name *</label>
            <input
              type="text"
              className="form-input"
              value={formData.parentName}
              onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
              required
              placeholder="John Smith"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                placeholder="john@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <h3 style={{ margin: '1.5rem 0 1rem', color: 'var(--primary)' }}>Child Information</h3>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Child's Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.childName}
                onChange={(e) => setFormData({ ...formData, childName: e.target.value })}
                required
                placeholder="Jane Smith"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Grade/Age *</label>
              <select
                className="form-select"
                value={formData.childGrade}
                onChange={(e) => setFormData({ ...formData, childGrade: e.target.value })}
                required
              >
                <option value="">Select grade</option>
                {GRADES.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Sport Selection *</label>
            <select
              className="form-select"
              value={formData.sport}
              onChange={(e) => setFormData({ ...formData, sport: e.target.value })}
              required
            >
              <option value="">Select a sport</option>
              {SPORTS.map((sport) => (
                <option key={sport} value={sport}>{sport}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact *</label>
            <input
              type="text"
              className="form-input"
              value={formData.emergencyContact}
              onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              required
              placeholder="Name and phone number"
            />
            <small style={{ color: 'var(--secondary)' }}>Person to contact in case of emergency</small>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
