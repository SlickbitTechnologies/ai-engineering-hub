import React, { useEffect, useRef } from 'react';

interface RangeSliderProps {
  name: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  displayValue?: string;
  label?: string;
  className?: string;
}

const RangeSlider: React.FC<RangeSliderProps> = ({
  name,
  min,
  max,
  step,
  value,
  onChange,
  displayValue,
  label,
  className = '',
}) => {
  const rangeRef = useRef<HTMLInputElement>(null);
  
  console.log(`Rendering RangeSlider: ${name}`);

  // Update the fill style when value changes
  useEffect(() => {
    if (rangeRef.current) {
      const percentage = ((value - min) / (max - min)) * 100;
      rangeRef.current.style.background = `linear-gradient(to right, #00aff0 0%, #00aff0 ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`;
    }
  }, [value, min, max]);

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}
      
      <div className="flex items-center">
        <input
          ref={rangeRef}
          type="range"
          name={name}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          style={{
            height: '6px',
            borderRadius: '5px',
            outline: 'none',
            WebkitAppearance: 'none'
          }}
        />
        <span className="ml-2 w-10 text-gray-700 text-right">{displayValue || value.toString()}</span>
      </div>
    </div>
  );
};

export default RangeSlider; 