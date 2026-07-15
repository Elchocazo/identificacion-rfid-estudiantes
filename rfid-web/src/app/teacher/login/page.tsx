import LoginForm from '@/components/LoginForm';

export default function TeacherLogin() {
  return (
    <main className="container flex-center" style={{ minHeight: '100vh' }}>
      <LoginForm role="teacher" title="Acceso Profesores" />
    </main>
  );
}
