'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, orderBy, limit, doc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function AdminDashboard() {
  const router = useRouter();
  const [attendances, setAttendances] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = '/';
  };

  // Configuraciones globales para el header
  const [settings, setSettings] = useState({ schoolName: 'Colegio Hogar Madre de Dios', currentPeriod: 1 });

  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode') || '';
    const userRole = localStorage.getItem('userRole');
    if (!schoolCode || userRole !== 'admin') {
      router.push('/');
      return;
    }

    // Escuchar Asistencias en tiempo real (evitando composite index)
    const qAttend = query(collection(db, 'attendance'), orderBy('timestamp', 'desc'), limit(50));
    const unsubAttend = onSnapshot(qAttend, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(att => att.schoolId === schoolCode)
        .slice(0, 15);
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

    setIsExporting(true);
    
    // Usamos setTimeout para permitir que React actualice la UI (el estado de "Exportando...") 
    // antes de bloquear el hilo principal con la generación del Excel pesado.
    setTimeout(() => {
      try {
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
      } catch (err) {
        console.error('Error exportando:', err);
        alert('Hubo un error al exportar el archivo.');
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="text-gradient" style={{ margin: 0 }}>Panel de Director</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{settings.schoolName} - Periodo {settings.currentPeriod}</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary" onClick={() => router.push('/settings')} title="Configuración de Cuenta">⚙️ Configuración</button>
          <button className="btn-secondary" onClick={handleLogout}>Cerrar Sesión</button>
        </div>
      </header>

      {/* Acciones Rápidas */}
      <section style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <button className="glass-panel" onClick={() => router.push('/admin/teachers/register')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', transition: 'transform 0.2s', border: '2px solid var(--accent)' }}>
          <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👨‍🏫</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Gestión de Docentes</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>Administrar accesos de profesores</span>
        </button>

        <button className="glass-panel" onClick={() => router.push('/teacher/register')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', transition: 'transform 0.2s', border: '2px solid var(--primary)' }}>
          <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>➕</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Agregar Estudiante</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>Registrar alumno nuevo</span>
        </button>

        <button className="glass-panel" onClick={() => router.push('/admin/settings')} style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', transition: 'transform 0.2s', border: '2px solid #8b5cf6' }}>
          <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏫</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>Configuración Colegio</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>Hora de llegada, nombre, periodo</span>
        </button>

        <button className="glass-panel" onClick={handleExportExcel} disabled={isExporting} style={{ cursor: isExporting ? 'wait' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', transition: 'transform 0.2s', border: '2px solid #10b981', opacity: isExporting ? 0.7 : 1 }}>
          <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{isExporting ? '⏳' : '📊'}</span>
          <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{isExporting ? 'Generando...' : 'Descargar Reporte'}</strong>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>Exportar asistencia a Excel</span>
        </button>
      </section>


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
