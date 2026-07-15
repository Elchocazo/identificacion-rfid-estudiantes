'use client';

import StudentProfile from '@/components/StudentProfile';
import { useRouter } from 'next/navigation';

export default function TeacherStudentProfile({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', maxWidth: '900px', margin: '0 auto' }}>
        <button className="btn-secondary" onClick={() => router.push('/teacher/dashboard')}>← Volver al Panel</button>
        <button className="btn-secondary" onClick={() => router.push('/')}>Cerrar Sesión</button>
      </div>
      <StudentProfile studentId={params.id} isAdmin={true} />
    </div>
  );
}
