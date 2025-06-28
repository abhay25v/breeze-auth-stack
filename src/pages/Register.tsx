
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Layout } from '@/components/layout/Layout';

const Register = () => {
  return (
    <Layout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <RegisterForm />
      </div>
    </Layout>
  );
};

export default Register;
