'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        // Fetch Global Settings
        const settingsRef = doc(db, 'settings', 'general');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists() && settingsSnap.data().schoolName) {
          setSchoolName(settingsSnap.data().schoolName);
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

  const handleUpdatePhotoClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            const base64Url = canvas.toDataURL('image/jpeg', 0.8);
            
            await setDoc(doc(db, 'students', studentId), { photoUrl: base64Url }, { merge: true });
            if (student) setStudent({ ...student, photoUrl: base64Url });
          }
          setIsUpdatingPhoto(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert("Error procesando la imagen.");
      setIsUpdatingPhoto(false);
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
      <section className="glass-panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '3rem', marginBottom: '2rem', padding: '3rem', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        
        {/* FOTO */}
        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            {student.photoUrl && student.photoUrl !== 'https://via.placeholder.com/150' ? (
              <img 
                src={student.photoUrl} 
                alt={student.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', fontSize: '5rem' }}>
                👦
              </div>
            )}
            <button 
              onClick={handleUpdatePhotoClick}
              disabled={isUpdatingPhoto}
              style={{
                position: 'absolute', bottom: '10px', right: '10px', background: 'var(--primary)', 
                color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px',
                cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)', transition: 'transform 0.2s',
                opacity: isUpdatingPhoto ? 0.5 : 1
              }}
              title="Cambiar Foto"
            >
              ✏️
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              style={{ display: 'none' }} 
            />
          </div>
          <h3 style={{ marginTop: '1.5rem', color: 'var(--text-main)', textAlign: 'center', fontSize: '1rem', fontWeight: '800', letterSpacing: '1px' }}>FOTO DE<br/>ESTUDIANTE</h3>
        </div>

        {/* DATOS & MASCOTA */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem' }}>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>NOMBRE:</span> 
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</span>
          </div>
          <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>IDENTIFICACIÓN:</span> 
            <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.idNumber}</span>
          </div>
          <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '0.5rem', paddingTop: '0.5rem' }}>
            <span className="text-muted" style={{ fontWeight: 'bold', width: '150px', display: 'inline-block' }}>GRADO:</span> 
            <span style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.grade || 'No asignado'}</span>
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
      <section className="glass-panel" style={{ padding: '0', overflow: 'hidden', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)' }}>
          <button 
            onClick={() => setActiveTab('historial')}
            style={{ 
              flex: 1, padding: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'historial' ? '#ffffff' : '#f8fafc',
              color: activeTab === 'historial' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'historial' ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.3s ease'
            }}
          >
            HISTORIAL DE ASISTENCIA
          </button>
          <button 
            onClick={() => setActiveTab('observaciones')}
            style={{ 
              flex: 1, padding: '1.5rem', fontSize: '1.1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
              background: activeTab === 'observaciones' ? '#ffffff' : '#f8fafc',
              color: activeTab === 'observaciones' ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: activeTab === 'observaciones' ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 0.3s ease'
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
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className="text-muted" style={{ fontWeight: 'bold', color: att.type === 'Entrada' ? 'var(--secondary)' : 'var(--primary)' }}>{att.type}</span>
                        {att.isLate && <span style={{ background: '#fecdd3', color: '#e11d48', padding: '0.1rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>Llegada Tarde</span>}
                      </div>
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
