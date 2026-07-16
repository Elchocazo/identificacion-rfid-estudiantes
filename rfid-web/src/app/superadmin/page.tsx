'use client';

import { useState, useEffect } from 'react';
import { auth, db, secondaryAuth } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [schools, setSchools] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');

  // Estados para crear administrador
  const [teacherId, setTeacherId] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherSchoolCode, setTeacherSchoolCode] = useState('');
  const [isCreatingTeacher, setIsCreatingTeacher] = useState(false);

  const SUPER_PASSWORD = '1061768991';

  const fetchSchools = async () => {
    const querySnapshot = await getDocs(collection(db, 'schools'));
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSchools(data);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSchools();
    }
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === SUPER_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName || !newSchoolCode) return;
    
    // Check if code already exists
    if (schools.some(s => s.code === newSchoolCode)) {
      alert('El código del colegio ya existe. Usa uno diferente.');
      return;
    }

    try {
      await setDoc(doc(db, 'schools', newSchoolCode), {
        name: newSchoolName,
        code: newSchoolCode,
        createdAt: serverTimestamp(),
        isActive: true
      });
      
      // Crear configuracion por defecto
      await setDoc(doc(db, `schools/${newSchoolCode}/settings`, 'general'), {
        schoolName: newSchoolName,
        currentPeriod: 1,
        lateArrivalTime: '07:00'
      });

      alert('Colegio creado exitosamente.');
      setNewSchoolName('');
      setNewSchoolCode('');
      fetchSchools();
    } catch (err) {
      console.error(err);
      alert('Error al crear colegio.');
    }
  };

  const handleDeleteSchool = async (code: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el colegio con código ${code}? Esto NO borrará sus estudiantes ni asistencias por seguridad, pero el colegio no podrá acceder.`)) {
      try {
        await deleteDoc(doc(db, 'schools', code));
        alert('Colegio eliminado del registro principal.');
        fetchSchools();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar.');
      }
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !teacherPassword || !teacherSchoolCode) return;
    
    setIsCreatingTeacher(true);
    try {
      const email = `${teacherId}@${teacherSchoolCode.toLowerCase()}.admin.school.com`;
      await createUserWithEmailAndPassword(secondaryAuth, email, teacherPassword);
      alert(`Cuenta de Administrador creada exitosamente para el colegio ${teacherSchoolCode}. Ya puede iniciar sesión.`);
      setTeacherId('');
      setTeacherPassword('');
      setTeacherSchoolCode('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        alert('Ese usuario ya tiene una cuenta. Intenta iniciar sesión con sus credenciales.');
      } else {
        alert('Error al crear la cuenta: ' + err.message);
      }
    } finally {
      setIsCreatingTeacher(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container animate-fade-in" style={{ padding: '4rem 2rem', display: 'flex', justifyContent: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '400px', width: '100%' }}>
          <h2>Acceso SuperAdmin</h2>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
            <input 
              type="password" 
              className="input-field" 
              placeholder="Contraseña Maestra" 
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <button className="btn-primary">Entrar</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem' }}>
      <h1 className="text-gradient">Panel Super Administrador</h1>
      <p style={{ color: 'var(--text-muted)' }}>Gestiona los colegios (SaaS Tenants)</p>

      <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {/* Formulario de Creación */}
        <div className="glass-panel" style={{ flex: '1 1 300px', height: 'fit-content' }}>
          <h2>Registrar Nuevo Colegio</h2>
          <form onSubmit={handleAddSchool} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nombre del Colegio</label>
              <input 
                type="text" 
                className="input-field" 
                value={newSchoolName} 
                onChange={e => setNewSchoolName(e.target.value)}
                placeholder="Ej. Instituto San José"
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código Único (Sin espacios, ID para Arduino)</label>
              <input 
                type="text" 
                className="input-field" 
                value={newSchoolCode} 
                onChange={e => setNewSchoolCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                placeholder="Ej. SAN_JOSE"
                required 
              />
            </div>
            <button type="submit" className="btn-primary" style={{ background: 'var(--secondary)', color: 'var(--navy-blue)' }}>Crear Colegio</button>
          </form>
        </div>

        {/* Lista de Colegios */}
        <div className="glass-panel" style={{ flex: '2 1 500px' }}>
          <h2>Colegios Registrados ({schools.length})</h2>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {schools.length === 0 ? <p className="text-muted">No hay colegios registrados.</p> : null}
            {schools.map(school => (
              <div key={school.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--navy-blue)' }}>{school.name}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: '#e2e8f0', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Código: {school.code}</span>
                </div>
                <button onClick={() => handleDeleteSchool(school.code)} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Crear cuenta de Administrador */}
        <section className="glass-panel" style={{ flex: '1 1 300px', height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.2rem' }}>Crear Administrador del Colegio</h2>
          <p className="text-muted" style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
            Asigna un acceso de Administrador (Director) para un colegio existente. El Administrador podrá luego crear a sus propios docentes.
          </p>
          <form onSubmit={handleCreateTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Código del Colegio</label>
              <select 
                className="input-field" 
                value={teacherSchoolCode} 
                onChange={e => setTeacherSchoolCode(e.target.value)}
                required
              >
                <option value="">Selecciona un colegio...</option>
                {schools.map(s => <option key={s.id} value={s.code}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Identificación (Login)</label>
              <input 
                type="text" 
                className="input-field" 
                value={teacherId} 
                onChange={e => setTeacherId(e.target.value)}
                placeholder="Ej. 1061768991"
                required 
              />
            </div>
            <div>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Contraseña</label>
              <input 
                type="password" 
                className="input-field" 
                value={teacherPassword} 
                onChange={e => setTeacherPassword(e.target.value)}
                placeholder="********"
                required 
              />
            </div>
            <button type="submit" className="btn-primary" disabled={isCreatingTeacher} style={{ background: 'var(--primary)', color: 'white' }}>
              {isCreatingTeacher ? 'Creando...' : 'Crear Cuenta Docente'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
