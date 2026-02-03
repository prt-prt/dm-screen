'use client';

import { ModuleType } from '@/types/canvas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  FileText,
  Skull,
  Music,
  ListOrdered,
  Calculator,
  Layers,
} from 'lucide-react';

interface ModuleToolbarProps {
  onAddModule: (type: ModuleType) => void;
}

const moduleOptions: { type: ModuleType; label: string; icon: typeof FileText }[] = [
  { type: 'note', label: 'note', icon: FileText },
  { type: 'statblock', label: 'statblock', icon: Skull },
  { type: 'audio-channel', label: 'audio', icon: Music },
  { type: 'audio-scene', label: 'scene', icon: Layers },
  { type: 'initiative', label: 'initiative', icon: ListOrdered },
  { type: 'calculator', label: 'calc', icon: Calculator },
];

export function ModuleToolbar({ onAddModule }: ModuleToolbarProps) {
  return (
    <div className="absolute top-3 left-3 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-8 w-8 flex items-center justify-center rounded border border-[#333] bg-[#242424] text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] transition-colors">
            <Plus className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-0 bg-[#242424] border-[#333]">
          {moduleOptions.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => onAddModule(option.type)}
              className="cursor-pointer text-[#888] hover:text-[#e5e5e5] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] focus:text-[#e5e5e5] gap-2 text-xs"
            >
              <option.icon className="h-3.5 w-3.5" />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
