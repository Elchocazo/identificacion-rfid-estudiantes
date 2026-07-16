'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

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
  const [userRole, setUserRole] = useState('');
  
  const [activeTab, setActiveTab] = useState<'historial' | 'observaciones'>('historial');
  const [newObservation, setNewObservation] = useState('');
  const [isEditingSchoolName, setIsEditingSchoolName] = useState(false);
  const [tempSchoolName, setTempSchoolName] = useState('');
  const [isUpdatingPhoto, setIsUpdatingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleDeleteStudent = async () => {
    if (!isAdmin) return;
    const confirmDelete = window.confirm("¿Estás seguro de que deseas borrar este estudiante? La tarjeta quedará libre para ser asignada nuevamente.");
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      const data = await res.json();
      if (data.success) {
        alert("Estudiante borrado exitosamente.");
        router.push('/admin/dashboard');
      } else {
        alert("Error al borrar: " + data.error);
      }
    } catch (error) {
      console.error(error);
      alert("Error de red al intentar borrar.");
    }
  };

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
        setUserRole(localStorage.getItem('userRole') || '');
        
        // Fetch Student
        const studentRef = doc(db, 'students', studentId);
        const studentSnap = await getDoc(studentRef);
        
        let fetchedSchoolId = '';
        if (studentSnap.exists()) {
          const sData = studentSnap.data();
          setStudent({ id: studentSnap.id, ...sData });
          fetchedSchoolId = sData.schoolId;
        }

        if (fetchedSchoolId) {
          // Fetch Global Settings
          const settingsRef = doc(db, `schools/${fetchedSchoolId}/settings`, 'general');
          const settingsSnap = await getDoc(settingsRef);
          if (settingsSnap.exists() && settingsSnap.data().schoolName) {
            setSchoolName(settingsSnap.data().schoolName);
          }
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
    // Edit disabled to prevent conflicts with Global Settings
    setIsEditingSchoolName(false);
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
        <h1 style={{ color: 'var(--text-main)', textAlign: 'center', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {schoolName}
        </h1>
        {isAdmin && (
          <button 
            onClick={handleDeleteStudent} 
            className="btn-primary" 
            style={{ position: 'absolute', right: 0, background: '#ef4444', color: 'white', boxShadow: 'none' }}
          >
            🗑️ Borrar Estudiante
          </button>
        )}
      </header>

      {/* TOP SECTION: FOTO Y DATOS */}
      <section style={{ 
        display: 'flex', flexWrap: 'wrap', marginBottom: '2rem', borderRadius: '24px', overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08)', background: 'var(--beige-card)'
      }}>
        
        {/* LEFT NAVY PANEL */}
        <div style={{ 
          flex: '0 0 300px', background: 'var(--navy-blue)', display: 'flex', flexDirection: 'column', 
          alignItems: 'center', padding: '3rem 2rem', position: 'relative',
          borderBottomRightRadius: '60px'
        }}>
          <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', overflow: 'hidden', border: '6px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.3)' }}>
            {student.photoUrl && student.photoUrl !== 'https://via.placeholder.com/150' ? (
              <img src={student.photoUrl} alt={student.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e2e8f0', fontSize: '6rem' }}>👦</div>
            )}
            <button onClick={handleUpdatePhotoClick} disabled={isUpdatingPhoto} style={{
                position: 'absolute', bottom: '15px', right: '15px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: isUpdatingPhoto ? 0.5 : 1
              }} title="Cambiar Foto">✏️</button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
          </div>
          
          <div style={{ 
            marginTop: '-15px', background: '#e2e8f0', color: 'var(--navy-blue)', padding: '0.5rem 1.5rem', 
            borderRadius: '20px', fontWeight: '800', fontSize: '0.9rem', letterSpacing: '1px', zIndex: 1, boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
          }}>
            PERFIL DEL ESTUDIANTE
          </div>
        </div>

        {/* RIGHT BEIGE PANEL */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 3rem', gap: '1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="profile-pill">
              <span style={{ fontSize: '1.5rem' }}>👤</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nombre</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{student.firstName} {student.lastName}</span>
              </div>
            </div>
            
            <div className="profile-pill">
              <span style={{ fontSize: '1.5rem' }}>🪪</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Identificación</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{student.idNumber}</span>
              </div>
            </div>

            <div className="profile-pill">
              <span style={{ fontSize: '1.5rem' }}>📞</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Acudiente</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{student.parentName} ({student.parentPhone})</span>
              </div>
            </div>

            <div className="profile-pill">
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nacimiento</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{student.birthday}</span>
              </div>
            </div>
            
            <div className="profile-pill">
              <span style={{ fontSize: '1.5rem' }}>🎓</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grado / Curso</span>
                <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>{student.grade || 'No asignado'}</span>
              </div>
            </div>
          </div>
          
          {/* MASCOTA SEGMENTADA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem', background: '#e2e8f0', padding: '1rem', borderRadius: '16px' }}>
             <img src={petImage} alt="Mascota" style={{ width: '60px', height: '60px', objectFit: 'contain' }} />
             <div style={{ flex: 1 }}>
               <strong style={{ color: 'var(--navy-blue)' }}>Mascota Virtual - Nivel {petLevel}</strong>
               <div style={{ display: 'flex', gap: '4px', marginTop: '0.5rem' }}>
                 {[...Array(10)].map((_, i) => (
                   <div key={i} style={{ 
                     flex: 1, height: '12px', borderRadius: '4px', 
                     background: i < Math.floor(petPoints / 10) ? 'var(--navy-blue)' : '#cbd5e1'
                   }} />
                 ))}
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION: TABS */}
      <section style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className={`profile-tab ${activeTab === 'historial' ? 'active' : ''}`} onClick={() => setActiveTab('historial')}>
          📁 Historial de Asistencia
        </div>
        {userRole !== 'student' && (
          <div className={`profile-tab ${activeTab === 'observaciones' ? 'active' : ''}`} onClick={() => setActiveTab('observaciones')}>
            📋 Observaciones
          </div>
        )}
      </section>

      {/* TAB CONTENT */}
      <section style={{ padding: '2rem', minHeight: '300px', background: 'var(--beige-card)', borderRadius: '24px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
        
        {/* TAB: HISTORIAL */}
        {activeTab === 'historial' && (
          <div>
            {attendances.length === 0 ? <p className="text-muted" style={{ textAlign: 'center' }}>No hay registros de asistencia.</p> : null}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
              {attendances.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1.5rem', background: 'white', border: '1px solid var(--beige-dark)', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--navy-blue)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                    {student.photoUrl && student.photoUrl !== 'https://via.placeholder.com/150' ? <img src={student.photoUrl} alt="P" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👦'}
                  </div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{student.firstName} {student.lastName}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <span>🕒 {att.timestamp?.toDate ? att.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}</span>
                      <span>📅 {att.timestamp?.toDate ? att.timestamp.toDate().toLocaleDateString() : '...'}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.3rem', 
                      background: att.isLate ? '#ffe4e6' : '#d1fae5', 
                      color: att.isLate ? '#e11d48' : '#059669', 
                      padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' 
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: att.isLate ? '#e11d48' : '#059669' }}></span>
                      {att.isLate ? 'LLEGADA TARDE' : att.type.toUpperCase()}
                    </div>
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
                  style={{ flex: 1, minHeight: '80px', resize: 'vertical', color: 'var(--text-main)', background: 'white' }}
                />
                <button className="btn-primary" onClick={handleAddObservation} style={{ alignSelf: 'stretch', background: 'var(--navy-blue)', boxShadow: 'none' }}>Agregar Observación</button>
              </div>
            )}

            {notes.length === 0 ? <p className="text-muted" style={{ textAlign: 'center' }}>No hay observaciones registradas.</p> : null}
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {notes.map(note => (
                <div key={note.id} style={{ padding: '1.5rem', background: 'white', border: '1px solid var(--beige-dark)', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <strong style={{ color: 'var(--navy-blue)' }}>Observación</strong>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {note.timestamp?.toDate ? note.timestamp.toDate().toLocaleDateString() : '...'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-main)', lineHeight: '1.6', fontSize: '0.95rem' }}>{note.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </section>

    </div>
  );
}
