import Link from 'next/link';

export default function Home() {
  return (
    <main className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
      <div className="glass-panel animate-fade-in" style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: '1.2' }}>
          RFID EduTracker
        </h1>
        <p className="text-muted" style={{ marginBottom: '2.5rem', fontSize: '1.1rem' }}>
          El futuro de la asistencia y el seguimiento escolar. Conecta tu lector NFC y obtén datos en tiempo real.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/teacher/login" style={{ width: '100%' }}>
            <button className="btn-primary" style={{ width: '100%', padding: '1rem' }}>
              👨‍🏫 Acceso Docentes
            </button>
          </Link>
          <Link href="/parent/login" style={{ width: '100%' }}>
            <button className="btn-secondary" style={{ width: '100%', padding: '1rem' }}>
              👨‍👩‍👧‍👦 Portal de Padres
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}
