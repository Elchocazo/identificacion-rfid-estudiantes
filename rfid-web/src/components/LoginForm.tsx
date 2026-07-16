'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

interface LoginFormProps {
  title?: string;
}

export default function LoginForm({ title = 'Iniciar Sesión' }: LoginFormProps) {
  const [idNumber, setIdNumber] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const isEmail = idNumber.includes('@');
      let loginSuccess = false;
      let finalRole = '';

      if (isEmail) {
        // Log in directly with email
        await signInWithEmailAndPassword(auth, idNumber, password);
        loginSuccess = true;
        // Determinaremos el rol después basándonos en la base de datos o dejaremos que el flujo lo descubra
        // Pero para mantener la lógica actual, asumimos que si usan email, tenemos que buscar quiénes son.
        // Mejor: Si usan email, su rol está en el custom token o tenemos que buscar en las colecciones.
        // Para simplificar: No sabemos su rol a priori. Lo buscaremos.
      } else {
        const roles = ['admin', 'teacher', 'student', 'parent'];
        for (const currentRole of roles) {
          try {
            const email = `${idNumber}@${schoolCode.toLowerCase()}.${currentRole}.school.com`;
            await signInWithEmailAndPassword(auth, email, password);
            loginSuccess = true;
            finalRole = currentRole;
            break; // Salir del loop si fue exitoso
          } catch (err: any) {
            // Si falla, el loop continúa con el siguiente rol
          }
        }
      }

      if (!loginSuccess) {
        throw new Error('Credenciales inválidas');
      }

      // Si inició sesión con email, necesitamos descubrir su rol
      if (isEmail && !finalRole) {
        const userDoc = await getDoc(doc(db, 'user_roles', auth.currentUser!.uid));
        if (userDoc.exists()) {
          finalRole = userDoc.data().role;
          setSchoolCode(userDoc.data().schoolCode);
        } else {
          // Fallback por defecto si algo falla, no debería pasar si vincularon correctamente.
          throw new Error('No se encontró el rol para este correo. Contacta soporte.');
        }
      }
      
      // Guardar el código del colegio en localStorage
      localStorage.setItem('schoolCode', schoolCode.toUpperCase());
      localStorage.setItem('userRole', finalRole);
      
      // Redirigir según el rol detectado
      if (finalRole === 'admin') {
        router.push('/admin/dashboard');
      } else if (finalRole === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        // Para parent o student, buscamos el ID del estudiante para mostrar su perfil
        const studentsRef = collection(db, 'students');
        // Si es padre, buscamos por parentId, si es estudiante, por idNumber
        const queryField = finalRole === 'parent' ? 'parentId' : 'idNumber';
        const q = query(studentsRef, where(queryField, '==', idNumber));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const studentId = snapshot.docs[0].id;
          // Guardamos en localstorage el id del estudiante
          router.push(`/parent/dashboard/${studentId}`);
        } else {
          // Si no encuentra al estudiante, que vaya al root (esto no debería pasar en datos sanos)
          router.push('/');
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
            Código del Colegio
          </label>
          <input
            type="text"
            required
            className="input-field"
            value={schoolCode}
            onChange={(e) => setSchoolCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
            placeholder="Ej. SAN_JOSE"
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Identificación
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
            placeholder="Tu contraseña"
          />
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={async () => {
              if (!idNumber.includes('@')) {
                alert('Debes ingresar tu correo registrado en el campo de arriba para poder restablecer la contraseña.');
                return;
              }
              try {
                await sendPasswordResetEmail(auth, idNumber);
                alert('Se ha enviado un enlace de recuperación a tu correo.');
              } catch (e: any) {
                alert('Error al enviar el correo. Verifica que esté bien escrito y registrado.');
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--navy-blue)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
          {loading ? 'Iniciando...' : 'Entrar al Panel'}
        </button>
      </form>
    </div>
  );
}
