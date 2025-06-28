
import { LoginForm } from '@/components/auth/LoginForm';
import { Layout } from '@/components/layout/Layout';

const Login = () => {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoginForm />
      </div>
    </Layout>
  );
};

export default Login;
