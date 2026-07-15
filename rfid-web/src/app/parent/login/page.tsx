import LoginForm from '@/components/LoginForm';

export default function ParentLogin() {
  return (
    <main className="container flex-center" style={{ minHeight: '100vh' }}>
      <LoginForm role="parent" title="Portal de Padres" />
    </main>
  );
}
