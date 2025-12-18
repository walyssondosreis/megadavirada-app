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
    <header className="bg-gray-100 shadow-md">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-center bg-gray-50">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity py-2"
          >
            <img 
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREHPemCyT-hC_xPyIMfOwfby1FM68c4GKOdg&s" 
              alt="Ícone" 
              className="w-8 h-8" 
            />
            <div className="text-center">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 ">
                {bolao?.titulo || '...Carregando'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-900">
                {bolao?.subtitulo || '...Carregando'}
              </p>
            </div>
          </button>
          </div>
          
            {isAdmin && (
            <div className='flex justify-end bg-white gap-2 py-2 px-4'>
              <button
                onClick={() => router.push('/admin')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <Settings size={18} />
                <span className="hidden sm:inline">Admin</span>
              </button>
              <button
                onClick={logout}
                className="px-3 sm:px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Sair
              </button>
            </div>
            )}
            
            {/* {user ? (
            ) : (
              <button hidden
                onClick={() => router.push('/login')}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Login</span>
              </button>
            )} */}
          <div className="flex gap-2 sm:gap-3">
            {bolao?.link_whatsapp && (
              <a
                href={bolao.link_whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 sm:px-4 py-1 bg-green-900 text-white hover:bg-green-700 text-sm transition-colors w-full justify-center"
              >
                <MessageCircle size={18} />
                <span className="">Grupo WhatsApp</span>
              </a>
            )}
            </div>
        {/* </div> */}
      </div>
    </header>
  );
}