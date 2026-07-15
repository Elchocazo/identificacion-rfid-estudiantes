'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';

export default function SuperAdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  
  const [schools, setSchools] = useState<any[]>([]);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [newSchoolCode, setNewSchoolCode] = useState('');

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
      </div>
    </div>
  );
}
