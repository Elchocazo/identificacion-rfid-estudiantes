'use client';

import StudentProfile from '@/components/StudentProfile';
import { useParams, useRouter } from 'next/navigation';

export default function ParentDashboard() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', maxWidth: '900px', margin: '0 auto' }}>
        <button className="btn-secondary" onClick={() => router.push('/settings')} title="Configuración de Cuenta">⚙️ Configuración</button>
        <button className="btn-secondary" onClick={() => router.push('/')}>Cerrar Sesión</button>
      </div>
      {id && <StudentProfile studentId={id} isAdmin={false} />}
    </div>
  );
}
