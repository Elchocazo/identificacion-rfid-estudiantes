'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db, secondaryAuth } from '@/lib/firebase';
import { collection, setDoc, doc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function RegisterTeacher() {
  const router = useRouter();
  const [schoolCode, setSchoolCode] = useState('');
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    const code = localStorage.getItem('schoolCode') || '';
    const userRole = localStorage.getItem('userRole');
    if (!code || userRole !== 'admin') {
      router.push('/');
      return;
    }
    setSchoolCode(code);
    fetchTeachers(code);
  }, []);

  const fetchTeachers = async (code: string) => {
    const q = query(collection(db, 'teachers'), where('schoolId', '==', code));
    const snap = await getDocs(q);
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    setTeachers(data);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolCode) return;
    setLoading(true);

    try {
      // 1. Crear el usuario en Firebase Auth con secondaryAuth
      const email = `${idNumber}@${schoolCode.toLowerCase()}.teacher.school.com`;
      let teacherPassword = idNumber;
      if (teacherPassword.length < 6) teacherPassword += "000000";

      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, teacherPassword);
      const newUid = userCredential.user.uid;

      // 2. Guardar el rol en user_roles
      await setDoc(doc(db, 'user_roles', newUid), {
        role: 'teacher',
        schoolCode: schoolCode
      });

      // 3. Guardar en la colección teachers
      await setDoc(doc(db, 'teachers', newUid), {
        uid: newUid,
        firstName,
        lastName,
        idNumber,
        schoolId: schoolCode,
        createdAt: serverTimestamp()
      });

      alert(`Docente creado exitosamente.\n\nUsuario: ${idNumber}\nContraseña: ${teacherPassword}`);
      setFirstName('');
      setLastName('');
      setIdNumber('');
      fetchTeachers(schoolCode);

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert('Este número de identificación ya está registrado.');
      } else {
        alert('Error al registrar al docente: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeTeacherPassword = async (teacher: any) => {
    const newPassword = prompt(`Ingresa la nueva contraseña para el docente ${teacher.firstName} ${teacher.lastName} (mínimo 6 caracteres):`);
    if (!newPassword) return; // User cancelled

    if (newPassword.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUid: teacher.uid, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        alert("Contraseña del docente actualizada exitosamente.");
      } else {
        alert("Error al cambiar contraseña: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al intentar cambiar la contraseña.");
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0', maxWidth: '800px' }}>
      <button className="btn-secondary" onClick={() => router.back()} style={{ marginBottom: '2rem' }}>
        ← Volver al Panel
      </button>

      <h1 className="text-gradient" style={{ marginBottom: '2rem' }}>Gestión de Docentes</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
        
        {/* Formulario de registro */}
        <div className="glass-panel" style={{ flex: '1 1 300px' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Registrar Nuevo Docente</h2>
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombres</label>
                <input type="text" required className="input-field" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Apellidos</label>
                <input type="text" required className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Número de Identificación</label>
              <input type="text" required className="input-field" value={idNumber} onChange={e => setIdNumber(e.target.value)} />
              <small style={{ color: 'var(--text-muted)' }}>Se usará como usuario y contraseña temporal.</small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', background: 'var(--accent)', borderColor: 'var(--accent)' }}>
              {loading ? 'Registrando...' : 'Registrar Docente'}
            </button>
          </form>
        </div>

        {/* Lista de docentes */}
        <div className="glass-panel" style={{ flex: '1 1 300px' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Docentes Activos</h2>
          {teachers.length === 0 ? (
            <p className="text-muted">No hay docentes registrados.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {teachers.map(teacher => (
                <div key={teacher.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: '1px solid var(--beige-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ display: 'block' }}>{teacher.firstName} {teacher.lastName}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID: {teacher.idNumber}</span>
                  </div>
                  <button 
                    onClick={() => handleChangeTeacherPassword(teacher)}
                    className="btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem', background: 'var(--primary)', color: 'white', border: 'none' }}
                  >
                    🔑 Cambiar Contraseña
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
