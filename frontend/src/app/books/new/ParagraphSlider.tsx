'use client';
import { useState } from 'react';

// Book length is measured in paragraphs; submits as the `pageCount` form field.
export default function ParagraphSlider({
  name = 'pageCount',
  min = 5,
  max = 10,
  defaultValue = 7,
}: {
  name?: string;
  min?: number;
  max?: number;
  defaultValue?: number;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 500 }}>Length</span>
        <span>{value} paragraphs</span>
      </div>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
