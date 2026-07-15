'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';

interface StudentProfileProps {
  studentId: string;
  isAdmin: boolean;
}

export default function StudentProfile({ studentId, isAdmin }: StudentProfileProps) {
  const [student, setStudent] = useState<any>(null);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [schoolName, setSchoolName] = useState('Colegio Hogar Madre de Dios');
  
  const [activeTab, setActiveTab] = useState<'historial' | 'observaciones'>('historial');
  const [newObservation, setNewObservation] = useState('');
  const [isEditingSchoolName, setIsEditingSchoolName] = useState(false);
  const [tempSchoolName, setTempSchoolName] = useState('');

  const fetchNotes = async () => {
    const notesRef = collection(db, 'notes');
    const qNotes = query(notesRef, where('studentId', '==', studentId));
    const notesSnap = await getDocs(qNotes);
    const notesData = notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
    notesData.sort((a: any, b: any) => b.timestamp - a.timestamp);
    setNotes(notesData);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch School Name
        const schoolRef = doc(db, 'settings', 'school');
        const schoolSnap = await getDoc(schoolRef);
        if (schoolSnap.exists() && schoolSnap.data().name) {
          setSchoolName(schoolSnap.data().name);
        }

        // Fetch Student
        const studentRef = doc(db, 'students', studentId);
        const studentSnap = await getDoc(studentRef);
        
        if (studentSnap.exists()) {
          setStudent({ id: studentSnap.id, ...studentSnap.data() });
        }

        // Fetch Attendance
        const attRef = collection(db, 'attendance');
        const qAtt = query(attRef, where('studentId', '==', studentId));
        const attSnap = await getDocs(qAtt);
        const attData = attSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
        attData.sort((a: any, b: any) => b.timestamp - a.timestamp);
        setAttendances(attData);

        // Fetch Notes
        await fetchNotes();

      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleSaveSchoolName = async () => {
    try {
      await setDoc(doc(db, 'settings', 'school'), { name: tempSchoolName }, { merge: true });
      setSchoolName(tempSchoolName);
      setIsEditingSchoolName(false);
    } catch (e) {
      alert("Error guardando el nombre del colegio.");
    }
  };

  const handleAddObservation = async () => {
    if (!newObservation.trim()) return;
    try {
      await addDoc(collection(db, 'notes'), {
        studentId,
        content: newObservation,
        timestamp: serverTimestamp(),
        teacherId: 'current_teacher'
      });
      setNewObservation('');
      fetchNotes(); // Reload notes
    } catch (e) {
      alert("Error guardando observación.");
    }
  };

  if (loading) return <div className="container flex-center" style={{ minHeight: '100vh', color: 'var(--text-main)' }}>Cargando perfil...</div>;
  if (!student) return <div className="container flex-center" style={{ minHeight: '100vh', color: 'var(--text-main)' }}>Estudiante no encontrado.</div>;

  const petLevel = student.petLevel || 1;
  const petPoints = student.petPoints || 0;
  const petImage = petLevel >= 2 ? '/pet_level_2.png' : '/pet_level_1.png';

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* HEADER COLEGIO */}
      <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
        {isAdmin && isEditingSchoolName ? (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              className="input-field" 
              value={tempSchoolName} 
              onChange={e => setTempSchoolName(e.target.value)} 
              style={{ padding: '0.5rem', width: '300px', color: 'black' }}
            />
            <button className="btn-primary" onClick={handleSaveSchoolName} style={{ padding: '0.5rem 1rem' }}>Guardar</button>
            <button className="btn-secondary" onClick={() => setIsEditingSchoolName(false)} style={{ padding: '0.5rem 1rem' }}>Cancelar</button>
          </div>
        ) : (
          <h1 style={{ color: 'var(--text-main)', textAlign: 'center', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {schoolName}
            {isAdmin && (
              <button 
                onClick={() => { setTempSchoolName(schoolName); setIsEditingSchoolName(true); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontSize: '1.2rem' }}
                title="Editar nombre del colegio"
              >
                ✏️
              </button>
            )}
          </h1>
        )}
      </header>

      {/* TOP SECTION: FOTO Y DATOS */}
      <section className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '2rem', padding: '3rem' }}>
        
        {/* FOTO */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {student.photoUrl && student.photoUrl !== 'https://via.placeholder.com/150' ? (
            <img 
              src={student.photoUrl} 
              alt={student.name} 
              style={{ width: '200px', height: '200px', objectFit: 'cover', border: '4px solid var(--text-main)' }} 
            />
          ) : (
            <div style={{ width: '200px', height: '200px', border: '4px solid var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', fontSize: '5rem' }}>
              👦
            </div>
          )}
          <h3 style={{ marginTop: '1rem', color: 'var(--text-main)', textAlign: 'center' }}>FOTO DE<br/>ESTUDIANTE</h3>
        </div>

        {/* DATOS & MASCOTA */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>NOMBRE:</span> 
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</span>
          </div>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>IDENTIFICACIÓN:</span> 
            <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.id}</span>
          </div>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>ACUDIENTE:</span> 
            <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.parentName} ({student.parentPhone})</span>
          </div>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>NACIMIENTO:</span> 
            <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.birthday}</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', background: '#f1f5f9', padding: '1rem', borderRadius: '8px' }}>
             <img src={petImage} alt="Mascota" style={{ width: '50px', height: '50px', objectFit: 'contain' }} />
             <div style={{ flex: 1 }}>
               <strong style={{ color: 'var(--text-main)' }}>Mascota Virtual - Nivel {petLevel}</strong>
               <div style={{ width: '100%', background: '#cbd5e1', borderRadius: '4px', height: '8px', marginTop: '0.5rem' }}>
                 <div style={{ width: `${petPoints}%`, background: 'var(--primary)', height: '100%', borderRadius: '4px' }} />
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION: TABS */}
      <section className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: '4px solid var(--text-main)' }}>
        <div style={{ display: 'flex', borderBottom: '4px solid var(--text-main)' }}>
          <button 
            onClick={() => setActiveTab('historial')}
            style={{ 
              flex: 1, padding: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'historial' ? '#ffffff' : '#f1f5f9',
              color: 'var(--text-main)',
              borderRight: '4px solid var(--text-main)',
              transition: 'background 0.2s'
            }}
          >
            HISTORIAL DE ASISTENCIA
          </button>
          <button 
            onClick={() => setActiveTab('observaciones')}
            style={{ 
              flex: 1, padding: '1.5rem', fontSize: '1.2rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'observaciones' ? '#ffffff' : '#f1f5f9',
              color: 'var(--text-main)',
              transition: 'background 0.2s'
            }}
          >
            OBSERVACIONES
          </button>
        </div>

        <div style={{ padding: '2rem', minHeight: '300px', background: '#ffffff' }}>
          
          {/* TAB: HISTORIAL */}
          {activeTab === 'historial' && (
            <div>
              {attendances.length === 0 ? <p className="text-muted">No hay registros de asistencia.</p> : null}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {attendances.map(att => (
                  <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</strong>
                      <span className="text-muted" style={{ fontWeight: 'bold', color: att.type === 'Entrada' ? 'var(--secondary)' : 'var(--primary)' }}>{att.type}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{att.timestamp?.toDate ? att.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</strong>
                      <span className="text-muted">{att.timestamp?.toDate ? att.timestamp.toDate().toLocaleDateString() : '...'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: OBSERVACIONES */}
          {activeTab === 'observaciones' && (
            <div>
              {isAdmin && (
                <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <textarea 
                    className="input-field" 
                    placeholder="Escribe una nueva observación aquí..." 
                    value={newObservation}
                    onChange={e => setNewObservation(e.target.value)}
                    style={{ flex: 1, minHeight: '80px', resize: 'vertical', color: 'black' }}
                  />
                  <button className="btn-primary" onClick={handleAddObservation} style={{ alignSelf: 'stretch' }}>Agregar Observación</button>
                </div>
              )}

              {notes.length === 0 ? <p className="text-muted">No hay observaciones registradas.</p> : null}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {notes.map(note => (
                  <div key={note.id} style={{ padding: '1.5rem', background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--primary)' }}>Observación del Docente</strong>
                      <span className="text-muted">
                        {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleString() : '...'}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-main)', lineHeight: '1.6' }}>{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
