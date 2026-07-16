'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { updatePassword, updateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function UserSettings() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [userRole, setUserRole] = useState('');
  const [schoolCode, setSchoolCode] = useState('');

  useEffect(() => {
    setUserRole(localStorage.getItem('userRole') || '');
    setSchoolCode(localStorage.getItem('schoolCode') || '');
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await updatePassword(auth.currentUser, newPassword);
      setMessage('Contraseña actualizada correctamente.');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Por seguridad, debes cerrar sesión y volver a entrar para cambiar la contraseña.');
      } else {
        setError('Error al actualizar contraseña. Mínimo 6 caracteres.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // 1. Guardar el rol en Firestore antes de perder el formato de correo falso
      await setDoc(doc(db, 'user_roles', auth.currentUser.uid), {
        role: userRole,
        schoolCode: schoolCode
      });

      // 2. Actualizar el correo en Firebase Auth
      await updateEmail(auth.currentUser, newEmail);
      setMessage('Correo de recuperación vinculado exitosamente. ¡A partir de ahora DEBES usar este correo para iniciar sesión!');
      setNewEmail('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Por seguridad, debes cerrar sesión y volver a entrar para vincular un correo.');
      } else {
        setError('Error al vincular correo. Asegúrate de que sea un correo válido y que no esté en uso.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0', maxWidth: '600px' }}>
      <button className="btn-secondary" onClick={() => router.back()} style={{ marginBottom: '2rem' }}>
        ← Volver
      </button>

      <h1 className="text-gradient" style={{ marginBottom: '2rem' }}>Configuración de Cuenta</h1>

      {message && <div style={{ background: '#d1fae5', color: '#059669', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}
      {error && <div style={{ background: '#ffe4e6', color: '#e11d48', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{error}</div>}

      <div className="glass-panel" style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Cambiar Contraseña</h2>
        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nueva Contraseña</label>
            <input 
              type="password" 
              className="input-field" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>Actualizar Contraseña</button>
        </form>
      </div>

      <div className="glass-panel">
        <h2 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Vincular Correo de Recuperación</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Si vinculas tu correo electrónico personal, podrás usar la opción de "Olvidé mi contraseña" en el futuro. 
          <strong> IMPORTANTE: </strong> Una vez vinculado, usarás este correo para iniciar sesión en lugar de tu Identificación.
        </p>
        <form onSubmit={handleUpdateEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Correo Electrónico</label>
            <input 
              type="email" 
              className="input-field" 
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-secondary" disabled={loading} style={{ background: '#3b82f6', color: 'white', borderColor: '#3b82f6' }}>
            Vincular Correo
          </button>
        </form>
      </div>
    </div>
  );
}
