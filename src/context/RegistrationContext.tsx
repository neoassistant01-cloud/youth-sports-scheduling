'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export interface Registration {
  id: number;
  parentName: string;
  email: string;
  phone: string;
  childName: string;
  childGrade: string;
  sport: string;
  emergencyContact: string;
  createdAt: Date;
}

interface RegistrationContextType {
  registrations: Registration[];
  addRegistration: (reg: Omit<Registration, 'id' | 'createdAt'>) => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

let registrationIdCounter = 1;

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);

  const addRegistration = (reg: Omit<Registration, 'id' | 'createdAt'>) => {
    const newRegistration: Registration = {
      ...reg,
      id: registrationIdCounter++,
      createdAt: new Date(),
    };
    setRegistrations(prev => [...prev, newRegistration]);
  };

  return (
    <RegistrationContext.Provider value={{ registrations, addRegistration }}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistrations() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistrations must be used within RegistrationProvider');
  }
  return context;
}
