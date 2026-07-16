'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState({ schoolName: 'Colegio Hogar Madre de Dios', currentPeriod: 1, lateArrivalTime: '07:00' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) {
      router.push('/');
      return;
    }

    const unsubSettings = onSnapshot(doc(db, `schools/${schoolCode}/settings`, 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({ 
          schoolName: data.schoolName || 'Colegio', 
          currentPeriod: data.currentPeriod || 1,
          lateArrivalTime: data.lateArrivalTime || '07:00'
        });
      } else {
        setDoc(doc(db, `schools/${schoolCode}/settings`, 'general'), { schoolName: `Colegio ${schoolCode}`, currentPeriod: 1, lateArrivalTime: '07:00' });
      }
    });

    return () => unsubSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const schoolCode = localStorage.getItem('schoolCode');
    if (!schoolCode) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, `schools/${schoolCode}/settings`, 'general'), settings, { merge: true });
      alert('¡Configuración guardada exitosamente!');
      router.push('/teacher/dashboard');
    } catch (e) {
      alert('Error guardando la configuración');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ padding: '4rem 2rem', maxWidth: '800px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>Configuración Global</h1>
        <button onClick={() => router.push('/teacher/dashboard')} className="btn-secondary">
          Atrás al Panel
        </button>
      </header>

      <div style={{ background: 'var(--beige-card)', padding: '3rem', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', border: '1px solid var(--beige-dark)' }}>
        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold' }}>Nombre del Colegio</label>
            <input 
              type="text" 
              className="input-field" 
              value={settings.schoolName} 
              onChange={e => setSettings({...settings, schoolName: e.target.value})} 
              required 
              style={{ background: 'white' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold' }}>Periodo Académico Actual</label>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>* Al cambiar de periodo, las faltas de los estudiantes comienzan desde 0 para el nuevo periodo.</p>
            <select 
              className="input-field" 
              value={settings.currentPeriod} 
              onChange={e => setSettings({...settings, currentPeriod: Number(e.target.value)})} 
              style={{ background: 'white' }}
            >
              <option value={1}>Periodo 1</option>
              <option value={2}>Periodo 2</option>
              <option value={3}>Periodo 3</option>
              <option value={4}>Periodo 4</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.8rem', color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 'bold' }}>Hora Límite de Llegada</label>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>* Los estudiantes que pasen la tarjeta después de esta hora serán marcados con Llegada Tarde.</p>
            <input 
              type="time" 
              className="input-field" 
              value={settings.lateArrivalTime} 
              onChange={e => setSettings({...settings, lateArrivalTime: e.target.value})} 
              required 
              style={{ background: 'white' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSaving} style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}>
            {isSaving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </form>
      </div>
    </div>
  );
}
