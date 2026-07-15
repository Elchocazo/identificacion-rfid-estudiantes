'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

export default function TeacherDashboard() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [pendingCards, setPendingCards] = useState<any[]>([]);
  
  // Para el formulario de notas
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Para el registro de estudiantes
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regData, setRegData] = useState({
    uid: '', pendingId: '', firstName: '', lastName: '', birthday: '', photoUrl: '', parentName: '', parentPhone: '', parentId: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Escuchar Asistencias en tiempo real
    const qAttend = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(15));
    const unsubAttend = onSnapshot(qAttend, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendances(data);
    });

    // Escuchar Estudiantes
    const unsubStudents = onSnapshot(collection(db, 'students'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
    });

    // Escuchar Tarjetas Pendientes
    const qPending = query(collection(db, 'pending_registrations'), orderBy('timestamp', 'desc'), limit(5));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPendingCards(data);
      // Autollenar el formulario si está abierto y llega una tarjeta
      if (data.length > 0) {
        setRegData(prev => prev.uid === '' ? { ...prev, uid: data[0].uid, pendingId: data[0].id } : prev);
      }
    });

    return () => {
      unsubAttend();
      unsubStudents();
      unsubPending();
    };
  }, []);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !noteContent) return;

    try {
      await addDoc(collection(db, 'notes'), {
        studentId: selectedStudentId,
        content: noteContent,
        timestamp: serverTimestamp(),
        teacherId: 'current_teacher'
      });
      setNoteContent('');
      alert('Nota agregada con éxito');
    } catch (error) {
      console.error(error);
      alert('Error agregando nota');
    }
  };

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(regData)
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Estudiante registrado! El padre puede iniciar sesión con Identificación: ' + regData.parentId + ' y Contraseña: ' + data.parentPassword);
        setShowRegisterForm(false);
        setRegData({ uid: '', pendingId: '', firstName: '', lastName: '', birthday: '', photoUrl: '', parentName: '', parentPhone: '', parentId: '' });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error de red al registrar');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 className="text-gradient">Panel de Control Docente</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn-primary" onClick={() => setShowRegisterForm(true)}>➕ Agregar Estudiante</button>
          <button className="btn-secondary" onClick={() => window.location.href='/'}>Cerrar Sesión</button>
        </div>
      </header>

      {/* MODAL DE REGISTRO */}
      {showRegisterForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2>Registrar Estudiante</h2>
              <button onClick={() => setShowRegisterForm(false)} style={{ background: 'transparent', color: 'white', border: 'none', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
            </div>
            
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--secondary)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <strong>Paso 1:</strong> Pasa una tarjeta nueva por el lector para detectarla.
              <br/>
              <span className="text-muted">
                Tarjetas pendientes detectadas: {pendingCards.length > 0 ? pendingCards.map(p => p.uid).join(', ') : 'Ninguna'}
              </span>
            </div>

            <form onSubmit={handleRegisterStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>UID de Tarjeta (Autollenado)</label>
                <input type="text" className="input-field" value={regData.uid} onChange={e => setRegData({...regData, uid: e.target.value})} required placeholder="Pasa la tarjeta..." />
              </div>
              
              <div>
                <label>Nombres</label>
                <input type="text" className="input-field" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} required />
              </div>
              <div>
                <label>Apellidos</label>
                <input type="text" className="input-field" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} required />
              </div>
              <div>
                <label>Fecha de Nacimiento</label>
                <input type="date" className="input-field" value={regData.birthday} onChange={e => setRegData({...regData, birthday: e.target.value})} required />
              </div>
              <div>
                <label>Foto (URL)</label>
                <input type="url" className="input-field" value={regData.photoUrl} onChange={e => setRegData({...regData, photoUrl: e.target.value})} placeholder="https://..." />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem', borderBottom: '1px solid var(--border)' }}></div>
              <h3 style={{ gridColumn: '1 / -1' }}>Datos del Acudiente / Padre</h3>

              <div>
                <label>Nombre del Padre</label>
                <input type="text" className="input-field" value={regData.parentName} onChange={e => setRegData({...regData, parentName: e.target.value})} required />
              </div>
              <div>
                <label>Teléfono</label>
                <input type="tel" className="input-field" value={regData.parentPhone} onChange={e => setRegData({...regData, parentPhone: e.target.value})} required />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label>Número de Identificación (Usado para el login)</label>
                <input type="text" className="input-field" value={regData.parentId} onChange={e => setRegData({...regData, parentId: e.target.value})} required />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={!regData.uid || isRegistering}>
                  {isRegistering ? 'Registrando...' : 'Finalizar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Feed de Asistencia */}
        <section className="glass-panel">
          <h2 style={{ marginBottom: '1rem' }}>Asistencia en Vivo</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attendances.length === 0 ? <p className="text-muted">Esperando lecturas de tarjeta...</p> : null}
            {attendances.map((att) => (
              <div key={att.id} style={{ 
                padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px',
                borderLeft: `4px solid ${att.type === 'Entrada' ? 'var(--secondary)' : '#ef4444'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{att.studentName || 'Estudiante Desconocido'}</strong>
                  <span style={{ color: att.type === 'Entrada' ? 'var(--secondary)' : '#ef4444', fontWeight: 'bold' }}>{att.type}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  UID: {att.uid} • {att.timestamp?.toDate ? att.timestamp.toDate().toLocaleTimeString() : '...'}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Panel para agregar notas */}
        <section className="glass-panel" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1rem' }}>Anotaciones de Convivencia</h2>
          <form onSubmit={handleAddNote} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Estudiante</label>
              <select className="input-field" value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} required>
                <option value="">-- Seleccionar --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nota / Observación</label>
              <textarea className="input-field" rows={4} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} placeholder="Escribe el reporte o anotación..." required />
            </div>
            <button type="submit" className="btn-primary">Guardar Nota</button>
          </form>
        </section>
      </div>
    </div>
  );
}
