import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext.jsx';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  return context;
}
