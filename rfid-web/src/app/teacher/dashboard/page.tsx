'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

export default function TeacherDashboard() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  // Para el formulario de notas
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [noteContent, setNoteContent] = useState('');

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

    return () => {
      unsubAttend();
      unsubStudents();
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
        teacherId: 'current_teacher' // Podría sacarse del auth
      });
      setNoteContent('');
      alert('Nota agregada con éxito');
    } catch (error) {
      console.error(error);
      alert('Error agregando nota');
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient">Panel de Control (Docente)</h1>
        <button className="btn-secondary" onClick={() => window.location.href='/'}>Cerrar Sesión</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Feed de Asistencia en Tiempo Real */}
        <section className="glass-panel">
          <h2 style={{ marginBottom: '1rem' }}>Asistencia en Vivo</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {attendances.length === 0 ? <p className="text-muted">Esperando lecturas de tarjeta...</p> : null}
            {attendances.map((att) => (
              <div key={att.id} style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                borderLeft: `4px solid ${att.type === 'Entrada' ? 'var(--secondary)' : '#ef4444'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong>{att.studentName || 'Estudiante Desconocido'}</strong>
                  <span style={{ color: att.type === 'Entrada' ? 'var(--secondary)' : '#ef4444', fontWeight: 'bold' }}>
                    {att.type}
                  </span>
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
              <select 
                className="input-field" 
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                required
              >
                <option value="">-- Seleccionar --</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.idNumber})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Nota / Observación</label>
              <textarea 
                className="input-field" 
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escribe el reporte o anotación..."
                required
              />
            </div>
            
            <button type="submit" className="btn-primary">Guardar Nota</button>
          </form>
        </section>
      </div>
    </div>
  );
}
