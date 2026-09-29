'use client';

import { useEffect, useRef, useState } from 'react';

type Platform = { id: string; name: string; slug?: string };
const clean = (name: string) => name.replace(/^\S+\s+/, '');

export function PlatformLogo({ platform }: { platform: Platform | null }) {
  const slug = (platform?.slug || clean(platform?.name || '').toLowerCase()).replace(/[^a-z]/g, '');
  const supported = ['facebook', 'tiktok', 'instagram', 'youtube'].includes(slug);
  return <span className={'platform-logo logo-' + slug} aria-hidden="true">
    {supported ? <img src={'https://cdn.simpleicons.org/' + slug + '/ffffff'} alt="" /> : '▶'}
  </span>;
}

export default function PlatformPicker({ items, value, onChange }: { items: Platform[]; value: string; onChange: (p: any) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = items.find((x) => x.id === value) || null;

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return <div className="platform-picker" ref={ref}>
    <button type="button" className="platform-trigger" onClick={() => setOpen((x) => !x)}>
      <PlatformLogo platform={selected} /><span>{selected ? clean(selected.name) : 'Chọn nền tảng'}</span><span className="picker-arrow">⌄</span>
    </button>
    {open && <div className="platform-menu">{items.map((item) => <button type="button" className={'platform-option ' + (item.id === value ? 'active' : '')} key={item.id} onClick={() => { onChange(item); setOpen(false); }}><PlatformLogo platform={item} /><span>{clean(item.name)}</span></button>)}</div>}
  </div>;
}
