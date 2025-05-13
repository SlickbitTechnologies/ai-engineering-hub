import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

interface SettingsContextType {
  minTemperatureThreshold: number | null;
  maxTemperatureThreshold: number | null;
  phoneNumber: string;
  updateTemperatureThresholds: (min: number | null, max: number | null) => void;
  updatePhoneNumber: (phone: string) => void;
  clearAllSettings: () => void;
}

const defaultSettings = {
  minTemperatureThreshold: null as number | null,
  maxTemperatureThreshold: null as number | null,
  phoneNumber: '',
  updateTemperatureThresholds: () => {},
  updatePhoneNumber: () => {},
  clearAllSettings: () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [minTemperatureThreshold, setMinTemperatureThreshold] = useState<number | null>(defaultSettings.minTemperatureThreshold);
  const [maxTemperatureThreshold, setMaxTemperatureThreshold] = useState<number | null>(defaultSettings.maxTemperatureThreshold);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultSettings.phoneNumber);
  const { currentUser } = useAuth();
  
  // Reset settings when user changes or logs out
  useEffect(() => {
    setMinTemperatureThreshold(null);
    setMaxTemperatureThreshold(null);
    setPhoneNumber('');
  }, [currentUser]);
  
  const updateTemperatureThresholds = (min: number | null, max: number | null) => {
    setMinTemperatureThreshold(min);
    setMaxTemperatureThreshold(max);
    
    // We no longer save to localStorage to ensure fresh settings on each login
  };
  
  const updatePhoneNumber = (phone: string) => {
    setPhoneNumber(phone);
    
    // We no longer save to localStorage to ensure fresh settings on each login
  };
  
  // Add function to clear all settings
  const clearAllSettings = () => {
    setMinTemperatureThreshold(null);
    setMaxTemperatureThreshold(null);
    setPhoneNumber('');
  };
  
  const value = {
    minTemperatureThreshold,
    maxTemperatureThreshold,
    phoneNumber,
    updateTemperatureThresholds,
    updatePhoneNumber,
    clearAllSettings
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 