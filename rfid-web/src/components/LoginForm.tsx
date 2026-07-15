'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface LoginFormProps {
  role: 'teacher' | 'parent';
  title: string;
}

export default function LoginForm({ role, title }: LoginFormProps) {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // TRUCO: Como Firebase Auth requiere un correo electrónico, vamos a simular uno
      // usando el número de identificación y el rol.
      // Ejemplo: 123456@parent.school.com o 987654@teacher.school.com
      const email = `${idNumber}@${role}.school.com`;
      
      await signInWithEmailAndPassword(auth, email, password);
      
      // Redirigir según el rol
      if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        // Para el padre, necesitamos buscar el ID del estudiante para mostrar su perfil
        const studentsRef = collection(db, 'students');
        const q = query(studentsRef, where('idNumber', '==', idNumber));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const studentId = snapshot.docs[0].id;
          router.push(`/parent/dashboard/${studentId}`);
        } else {
          router.push('/parent/dashboard');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Credenciales inválidas. Verifica tu identificación y contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
      <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>{title}</h2>
      
      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Número de Identificación
          </label>
          <input
            type="text"
            required
            className="input-field"
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="Ej. 10203040"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Contraseña
          </label>
          <input
            type="password"
            required
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
          />
        </div>
        
        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Ingresando...' : 'Iniciar Sesión'}
        </button>
      </form>
    </div>
  );
}
