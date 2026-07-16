import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <main className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>
          RFID EduTracker
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto' }}>
          Plataforma integral de asistencia escolar. Inicia sesión para continuar.
        </p>
      </div>

      <LoginForm title="Acceso a la Plataforma" />

    </main>
  );
}
