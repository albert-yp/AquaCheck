import { DEMO_CREDENTIALS } from '../data/mockData.js';
import { clearSession, initializeStorage, loadSession, saveSession } from '../storage/appStorage.js';

function toPublicUser({ id, name, username, role, isActive }) {
  return { id, name, username, role, isActive };
}

export function createAuthService({ storage } = {}) {
  return {
    getSessionUser() {
      const { data } = initializeStorage({ storage });
      const session = loadSession({ storage });
      if (!session) return null;
      const user = data.users.find((item) => item.id === session.userId && item.isActive);
      if (!user) { clearSession({ storage }); return null; }
      return toPublicUser(user);
    },
    login(username, password) {
      const normalized = typeof username === 'string' ? username.trim().toLowerCase() : '';
      if (!normalized) throw new Error('Masukkan username akun demo.');
      if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Masukkan password akun demo.');
      }
      if (!Object.hasOwn(DEMO_CREDENTIALS, normalized) || DEMO_CREDENTIALS[normalized] !== password) {
        throw new Error('Username atau password tidak sesuai.');
      }
      const { data } = initializeStorage({ storage });
      const user = data.users.find((item) => item.isActive && item.username.toLowerCase() === normalized);
      if (!user) throw new Error('Username atau password tidak sesuai.');
      saveSession(user.id, { storage });
      return toPublicUser(user);
    },
    logout() { clearSession({ storage }); },
  };
}
