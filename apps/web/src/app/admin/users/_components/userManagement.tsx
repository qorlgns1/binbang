'use client';

import { useMemo, useState } from 'react';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';

import { UsersTable } from './usersTable';

const ROLE_OPTIONS = [
  { value: 'all', label: '전체 역할' },
  { value: 'USER', label: 'User' },
  { value: 'ADMIN', label: 'Admin' },
] as const;

export function UserManagement() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const debouncedSearch = useDebouncedValue(search, 300);

  const filters = useMemo(
    () => ({
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(role !== 'all' ? { role } : {}),
    }),
    [debouncedSearch, role],
  );

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <Input
          placeholder='이름 또는 이메일 검색...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-64'
        />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <UsersTable filters={filters} />
    </div>
  );
}
