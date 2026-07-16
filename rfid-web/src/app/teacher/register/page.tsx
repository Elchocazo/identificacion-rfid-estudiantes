'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function RegisterStudentPage() {
  const router = useRouter();
  const [regData, setRegData] = useState({
    uid: '', pendingId: '', idNumber: '', firstName: '', lastName: '', birthday: '', photoUrl: '', parentName: '', parentPhone: '', parentId: '', grade: ''
  });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    // Escuchar Tarjetas Pendientes para autollenar el UID
    const qPending = query(collection(db, 'pending_registrations'), orderBy('timestamp', 'desc'), limit(1));
    const unsubPending = onSnapshot(qPending, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      if (data.length > 0 && regData.uid === '') {
        setRegData(prev => ({ ...prev, uid: data[0].uid, pendingId: data[0].id }));
      }
    });

    return () => unsubPending();
  }, [regData.uid]);

  const handleRegisterStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);
    try {
      const payload = { ...regData, schoolId: schoolId };
      
      const res = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('¡Estudiante registrado! El padre puede iniciar sesión con Identificación: ' + regData.parentId + ' y Contraseña: ' + data.parentPassword);
        router.push('/teacher/dashboard');
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
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>Registrar Estudiante</h1>
        <button onClick={() => router.push('/teacher/dashboard')} className="btn-secondary">
          Atrás al Panel
        </button>
      </header>

      <div style={{ background: 'var(--beige-card)', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid var(--beige-dark)' }}>
        <form onSubmit={handleRegisterStudent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          <div style={{ gridColumn: '1 / -1', background: 'rgba(14, 165, 233, 0.1)', padding: '1.5rem', borderRadius: '12px', display: 'flex', gap: '1rem', alignItems: 'flex-end', border: '1px dashed var(--primary)' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>UID de la Tarjeta (Pasa la tarjeta por el lector)</label>
              <input type="text" className="input-field" value={regData.uid} onChange={e => setRegData({...regData, uid: e.target.value})} required placeholder="Esperando tarjeta..." style={{ background: 'white', fontWeight: 'bold', letterSpacing: '1px' }} />
            </div>
            <button type="button" onClick={() => setRegData({...regData, uid: '', pendingId: ''})} className="btn-secondary" style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Limpiar y esperar nueva tarjeta">
              🔄
            </button>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Número de Identidad</label>
            <input type="text" className="input-field" value={regData.idNumber} onChange={e => setRegData({...regData, idNumber: e.target.value})} required placeholder="Ej. 100200300" style={{ background: 'white' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Grado / Curso</label>
            <input type="text" className="input-field" value={regData.grade} onChange={e => setRegData({...regData, grade: e.target.value})} required placeholder="Ej. Quinto, 10A, etc." style={{ background: 'white' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Nombres</label>
            <input type="text" className="input-field" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} required style={{ background: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Apellidos</label>
            <input type="text" className="input-field" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} required style={{ background: 'white' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Fecha de Nacimiento</label>
            <input type="date" className="input-field" value={regData.birthday} onChange={e => setRegData({...regData, birthday: e.target.value})} required style={{ background: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>URL Foto (Opcional)</label>
            <input type="url" className="input-field" value={regData.photoUrl} onChange={e => setRegData({...regData, photoUrl: e.target.value})} placeholder="https://..." style={{ background: 'white' }} />
          </div>

          <div style={{ gridColumn: '1 / -1', borderTop: '2px solid var(--border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Datos del Acudiente</h3>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Nombre Completo</label>
            <input type="text" className="input-field" value={regData.parentName} onChange={e => setRegData({...regData, parentName: e.target.value})} required style={{ background: 'white' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Teléfono (WhatsApp)</label>
            <input type="tel" className="input-field" value={regData.parentPhone} onChange={e => setRegData({...regData, parentPhone: e.target.value})} required style={{ background: 'white' }} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 'bold' }}>Identificación del Acudiente (Login padre)</label>
            <input type="text" className="input-field" value={regData.parentId} onChange={e => setRegData({...regData, parentId: e.target.value})} required placeholder="Ej. 10203040" style={{ background: 'white' }} />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '1.5rem' }}>
            <button type="submit" className="btn-primary" disabled={isRegistering} style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              {isRegistering ? 'Registrando...' : 'Confirmar Registro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
