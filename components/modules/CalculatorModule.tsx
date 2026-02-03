'use client';

import { memo, useState, useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { ModuleWrapper } from './ModuleWrapper';
import { Calculator, ArrowRight } from 'lucide-react';

type Unit = 'feet' | 'meters' | 'squares' | 'miles' | 'km';

const conversions: Record<Unit, Record<Unit, number>> = {
  feet: { feet: 1, meters: 0.3048, squares: 0.2, miles: 0.000189394, km: 0.0003048 },
  meters: { feet: 3.28084, meters: 1, squares: 0.65617, miles: 0.000621371, km: 0.001 },
  squares: { feet: 5, meters: 1.524, squares: 1, miles: 0.000946969, km: 0.001524 },
  miles: { feet: 5280, meters: 1609.34, squares: 1056, miles: 1, km: 1.60934 },
  km: { feet: 3280.84, meters: 1000, squares: 656.168, miles: 0.621371, km: 1 },
};

const units: Unit[] = ['feet', 'meters', 'squares', 'miles', 'km'];

export const CalculatorModule = memo(function CalculatorModule(props: NodeProps) {
  const [inputValue, setInputValue] = useState('');
  const [fromUnit, setFromUnit] = useState<Unit>('feet');
  const [toUnit, setToUnit] = useState<Unit>('meters');

  const convert = useCallback(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return '—';
    const result = num * conversions[fromUnit][toUnit];
    return result.toFixed(2);
  }, [inputValue, fromUnit, toUnit]);

  return (
    <ModuleWrapper
      nodeProps={props}
      icon={<Calculator className="h-3.5 w-3.5" />}
      color="text-[#a78bfa]"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            placeholder="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-16 px-2 py-1 text-xs bg-[#1f1f1f] border border-[#333] rounded text-[#e5e5e5] placeholder-[#555] focus:outline-none focus:border-[#555]"
          />
          <select
            value={fromUnit}
            onChange={(e) => setFromUnit(e.target.value as Unit)}
            className="px-1.5 py-1 text-[10px] bg-[#1f1f1f] border border-[#333] rounded text-[#888] focus:outline-none"
          >
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-16 px-2 py-1 text-xs bg-[#1f1f1f] border border-[#333] rounded text-center font-mono text-[#e5e5e5]">
            {convert()}
          </div>
          <select
            value={toUnit}
            onChange={(e) => setToUnit(e.target.value as Unit)}
            className="px-1.5 py-1 text-[10px] bg-[#1f1f1f] border border-[#333] rounded text-[#888] focus:outline-none"
          >
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>
    </ModuleWrapper>
  );
});
