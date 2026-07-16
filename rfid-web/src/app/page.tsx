import LoginForm from '@/components/LoginForm';

export default function Home() {
  return (
    <main className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '2rem', marginTop: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '0.5rem', lineHeight: '1.2' }}>
          Identificación
        </h1>
      </div>

      <LoginForm title="Iniciar Sesión" />

    </main>
  );
}
