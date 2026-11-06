import { useContext } from 'react';
import { AppDataContext } from '../contexts/AppDataContext.jsx';

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === null) throw new Error('useAppData harus digunakan di dalam AppDataProvider.');
  return context;
}
