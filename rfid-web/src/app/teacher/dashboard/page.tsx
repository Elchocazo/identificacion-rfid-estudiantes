'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function TeacherDashboard() {
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Configuraciones globales para el header
  const [settings, setSettings] = useState({ schoolName: 'Colegio Hogar Madre de Dios', currentPeriod: 1 });

  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode') || '';
    if (!schoolCode) {
      router.push('/teacher/login');
      return;
    }

    // Escuchar Asistencias en tiempo real
    const qAttend = query(collection(db, 'attendance'), where('schoolId', '==', schoolCode), orderBy('timestamp', 'desc'), limit(15));
    const unsubAttend = onSnapshot(qAttend, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setAttendances(data);
    });

    // Escuchar Estudiantes
    const qStudents = query(collection(db, 'students'), where('schoolId', '==', schoolCode));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setStudents(data);
    });

    // Escuchar Configuración Global
    const unsubSettings = onSnapshot(doc(db, `schools/${schoolCode}/settings`, 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({ 
          schoolName: data.schoolName || 'Colegio', 
          currentPeriod: data.currentPeriod || 1 
        });
      } else {
        // Fallback si no hay configuración
        setSettings({ schoolName: `Colegio ${schoolCode}`, currentPeriod: 1 });
      }
    });

    return () => {
      unsubAttend();
      unsubStudents();
      unsubSettings();
    };
  }, []);

  const handleExportExcel = () => {
    if (attendances.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const dataToExport = attendances.map(att => {
      const dateObj = att.timestamp?.toDate ? att.timestamp.toDate() : new Date();
      return {
        'Fecha': dateObj.toLocaleDateString(),
        'Hora': dateObj.toLocaleTimeString(),
        'Estudiante': att.studentName || 'Desconocido',
        'Grado/Curso': att.studentGrade || 'No asignado',
        'Periodo': att.period || 1,
        'Estado': att.isLate ? 'LLEGADA TARDE' : att.type.toUpperCase()
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Asistencia');
    XLSX.writeFile(workbook, `Reporte_Asistencia_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="text-gradient" style={{ margin: 0 }}>Panel de Control Docente</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{settings.schoolName} - Periodo {settings.currentPeriod}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={handleExportExcel} style={{ background: '#10b981', color: 'white', borderColor: '#10b981' }}>📊 Descargar Excel</button>
          <button className="btn-secondary" onClick={() => router.push('/teacher/settings')} title="Configuración">⚙️</button>
          <button className="btn-primary" onClick={() => router.push('/teacher/register')}>➕ Agregar Estudiante</button>
          <button className="btn-secondary" onClick={() => window.location.href='/'}>Cerrar Sesión</button>
        </div>
      </header>

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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <strong style={{ color: 'var(--text-main)', fontSize: '1rem' }}>{att.studentName || 'Estudiante Desconocido'}</strong>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                      Grado: {att.studentGrade || 'No asignado'} • {att.timestamp?.toDate ? att.timestamp.toDate().toLocaleTimeString() : '...'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
                    <div style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.3rem', 
                      background: att.isLate ? '#ffe4e6' : (att.type === 'Entrada' ? '#d1fae5' : '#fee2e2'), 
                      color: att.isLate ? '#e11d48' : (att.type === 'Entrada' ? '#059669' : '#dc2626'), 
                      padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' 
                    }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: att.isLate ? '#e11d48' : (att.type === 'Entrada' ? '#059669' : '#dc2626') }}></span>
                      {att.isLate ? 'LLEGADA TARDE' : att.type.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Panel Lista de Estudiantes */}
        <section className="glass-panel" style={{ height: 'fit-content' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Lista de Estudiantes</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {students.map(s => (
              <div 
                key={s.id} 
                onClick={() => window.location.href = `/teacher/student/${s.id}`}
                style={{ 
                  padding: '1rem', background: '#f8fafc', borderRadius: '8px', 
                  border: '1px solid var(--border)', cursor: 'pointer',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ color: 'var(--text-main)', fontSize: '1.1rem' }}>{s.firstName} {s.lastName}</strong>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Grado: {s.grade || 'No asignado'}</span>
                </div>
                <span style={{ color: 'var(--primary)' }}>Ver Perfil ➔</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
