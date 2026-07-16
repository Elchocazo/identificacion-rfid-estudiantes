'use client';

import StudentProfile from '@/components/StudentProfile';
import { useParams, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export default function TeacherStudentProfile() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <div style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', maxWidth: '900px', margin: '0 auto' }}>
        <button className="btn-secondary" onClick={() => router.push('/teacher/dashboard')}>← Volver al Panel</button>
        <button className="btn-secondary" onClick={handleLogout}>Cerrar Sesión</button>
      </div>
      {id && <StudentProfile studentId={id} isAdmin={true} />}
    </div>
  );
}
