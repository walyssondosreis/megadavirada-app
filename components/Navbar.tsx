'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Settings, LogIn, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase, Bolao } from '@/lib/supabase';

export default function Navbar() {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const [bolao, setBolao] = useState<Bolao | null>(null);

  useEffect(() => {
    loadBolao();
    
    // Recarregar a cada 5 segundos para pegar atualizações
    const interval = setInterval(loadBolao, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadBolao = async () => {
    const { data } = await supabase
      .from('boloes')
      .select('*')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setBolao(data);
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Trophy className="text-purple-600" size={32} />
            <div className="text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {bolao?.titulo || '...Carregando'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {bolao?.subtitulo || '...Carregando'}
              </p>
            </div>
          </button>
          
          <div className="flex items-center gap-2 sm:gap-3">
            {bolao?.link_whatsapp && (
              <a
                href={bolao.link_whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
              >
                <MessageCircle size={18} />
                <span className="hidden sm:inline">Grupo</span>
              </a>
            )}
            
            {isAdmin && (
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
            
            {user ? (
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Sair
              </button>
            ) : (
              <button hidden
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}