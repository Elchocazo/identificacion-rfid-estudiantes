'use client';

import StudentProfile from '@/components/StudentProfile';
import { useParams, useRouter } from 'next/navigation';

export default function TeacherStudentProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', maxWidth: '900px', margin: '0 auto' }}>
        <button className="btn-secondary" onClick={() => router.push('/teacher/dashboard')}>← Volver al Panel</button>
        <button className="btn-secondary" onClick={() => router.push('/')}>Cerrar Sesión</button>
      </div>
      {id && <StudentProfile studentId={id} isAdmin={true} />}
    </div>
  );
}
