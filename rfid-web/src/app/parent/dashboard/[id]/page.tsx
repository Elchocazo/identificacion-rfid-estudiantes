'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

export default function ParentDashboard({ params }: { params: { id: string } }) {
  const [student, setStudent] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const studentRef = doc(db, 'students', params.id);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          setStudent({ id: studentSnap.id, ...studentSnap.data() });
        } else {
          console.error("No se encontró el estudiante");
        }

        const attRef = collection(db, 'attendance');
        const qAtt = query(attRef, where('studentId', '==', params.id));
        const attSnap = await getDocs(qAtt);
        const attData = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        attData.sort((a: any, b: any) => b.timestamp - a.timestamp);
        setAttendances(attData);

        const notesRef = collection(db, 'notes');
        const qNotes = query(notesRef, where('studentId', '==', params.id));
        const notesSnap = await getDocs(qNotes);
        const notesData = notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        notesData.sort((a: any, b: any) => b.timestamp - a.timestamp);
        setNotes(notesData);

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <div className="container flex-center" style={{ minHeight: '100vh' }}>Cargando portal...</div>;
  if (!student) return <div className="container flex-center" style={{ minHeight: '100vh' }}>Estudiante no encontrado.</div>;

  const petLevel = student.petLevel || 1;
  const petPoints = student.petPoints || 0;
  const petImage = petLevel >= 2 ? '/pet_level_2.png' : '/pet_level_1.png';

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className="text-gradient">Portal de {student.name}</h1>
        <button className="btn-secondary" onClick={() => window.location.href='/'}>Cerrar Sesión</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Perfil del Estudiante */}
          <section className="glass-panel" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            {student.photoUrl && student.photoUrl !== 'https://via.placeholder.com/150' ? (
              <img src={student.photoUrl} alt={student.name} style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
            ) : (
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
                👦
              </div>
            )}
            <div>
              <h2 style={{ marginBottom: '0.5rem' }}>{student.firstName} {student.lastName}</h2>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Nacido: {student.birthday}</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Acudiente: {student.parentName} ({student.parentPhone})</p>
            </div>
          </section>

          {/* Mascota Virtual */}
          <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <h2>Mascota Virtual</h2>
            <p className="text-muted" style={{ marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              ¡La mascota evoluciona con la asistencia a clases!
            </p>
            
            <div style={{ 
              width: '200px', height: '200px', 
              borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              marginBottom: '1.5rem', boxShadow: '0 0 30px rgba(79, 70, 229, 0.4)'
            }}>
              <img src={petImage} alt="Mascota Virtual" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
            </div>
            
            <h3>Nivel {petLevel}</h3>
            <div style={{ width: '100%', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', height: '12px', marginTop: '1rem', overflow: 'hidden' }}>
              <div style={{ width: `${petPoints}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', height: '100%', transition: 'width 0.5s ease' }} />
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{petPoints} / 100 puntos</p>
          </section>
        </div>

        {/* Historial y Notas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Últimas Asistencias</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {attendances.length === 0 ? <p className="text-muted">No hay registros.</p> : null}
              {attendances.map(att => (
                <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{att.type}</span>
                  <span className="text-muted">{att.timestamp?.toDate ? att.timestamp.toDate().toLocaleString() : '...'}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-panel">
            <h2 style={{ marginBottom: '1rem' }}>Notas de Convivencia</h2>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {notes.length === 0 ? <p className="text-muted">No hay notas registradas. ¡Todo excelente!</p> : null}
              {notes.map(note => (
                <div key={note.id} style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', marginBottom: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleDateString() : '...'}
                  </div>
                  <p>{note.content}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
