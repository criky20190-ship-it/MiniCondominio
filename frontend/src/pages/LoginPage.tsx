import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/apiService';
import { jwtDecode } from 'jwt-decode';
import { Home } from 'lucide-react';

interface LoginPageProps {
  setUser: (user: any) => void;
}

export default function LoginPage({ setUser }: LoginPageProps) {
  const navigate = useNavigate();

  const handleLoginSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      const decoded = jwtDecode<any>(credentialResponse.credential!);
      const response = await authService.google(
        decoded.email,
        decoded.name,
        decoded.sub,
        decoded.picture
      );

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      alert('Errore durante il login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
        <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full">
            <Home className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">MiniCondominio</h1>
        <p className="text-center text-gray-600 mb-8">Gestione facile e moderna dei condomini</p>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Accedi con Google</h2>
            <GoogleLogin
              onSuccess={handleLoginSuccess}
              onError={() => alert('Errore durante il login')}
            />
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Effettua il login per accedere alla dashboard</p>
          </div>
        </div>
      </div>
    </div>
  );
}
