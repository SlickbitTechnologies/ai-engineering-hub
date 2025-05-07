import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
  minTemperatureThreshold: number;
  maxTemperatureThreshold: number;
  phoneNumber: string;
  updateTemperatureThresholds: (min: number, max: number) => void;
  updatePhoneNumber: (phone: string) => void;
}

const defaultSettings = {
  minTemperatureThreshold: 2,
  maxTemperatureThreshold: 8,
  phoneNumber: '',
  updateTemperatureThresholds: () => {},
  updatePhoneNumber: () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [minTemperatureThreshold, setMinTemperatureThreshold] = useState<number>(defaultSettings.minTemperatureThreshold);
  const [maxTemperatureThreshold, setMaxTemperatureThreshold] = useState<number>(defaultSettings.maxTemperatureThreshold);
  const [phoneNumber, setPhoneNumber] = useState<string>(defaultSettings.phoneNumber);
  
  // Load settings from localStorage on mount
  useEffect(() => {
    const savedMinTemp = localStorage.getItem('minTemperatureThreshold');
    const savedMaxTemp = localStorage.getItem('maxTemperatureThreshold');
    const savedPhone = localStorage.getItem('phoneNumber');
    
    if (savedMinTemp) {
      setMinTemperatureThreshold(parseFloat(savedMinTemp));
    }
    
    if (savedMaxTemp) {
      setMaxTemperatureThreshold(parseFloat(savedMaxTemp));
    }
    
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  }, []);
  
  const updateTemperatureThresholds = (min: number, max: number) => {
    setMinTemperatureThreshold(min);
    setMaxTemperatureThreshold(max);
    
    // Save to localStorage
    localStorage.setItem('minTemperatureThreshold', min.toString());
    localStorage.setItem('maxTemperatureThreshold', max.toString());
    
    // In a real app, you might also save to a backend/Firebase here
  };
  
  const updatePhoneNumber = (phone: string) => {
    setPhoneNumber(phone);
    
    // Save to localStorage
    localStorage.setItem('phoneNumber', phone);
    
    // In a real app, you might also save to a backend/Firebase here
  };
  
  const value = {
    minTemperatureThreshold,
    maxTemperatureThreshold,
    phoneNumber,
    updateTemperatureThresholds,
    updatePhoneNumber
  };
  
  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}; 