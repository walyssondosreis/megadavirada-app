'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, MessageCircle, LogOut } from 'lucide-react';
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

  const handleLogout = () => {
    if (confirm('Tem certeza que deseja sair?')) {
      logout();
    }
  };

  return (
    <header className="bg-gradient-to-r from-green-900 to-emerald-900 shadow-lg">
      <div className="max-w-full mx-auto">
        {/* Parte superior: Logo e título lado a lado */}
        <div className="flex items-center justify-between px-4 py-3 sm:py-4 bg-gradient-to-b from-green-800/50 to-green-900/30">
          {/* Logo + Título lado a lado */}
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity group"
          >
            <div className="relative">
              <img 
                src="https://static.vecteezy.com/system/resources/previews/019/880/710/non_2x/four-leaf-clover-png.png" 
                alt="Ícone do Bolão" 
                className="w-12 h-12 sm:w-14 sm:h-14 object-contain group-hover:scale-105 transition-transform"
              />
            </div>
            
            <div className="text-left">
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {bolao?.titulo || '...Carregando'}
              </h1>
              <p className="text-xs text-green-100 mt-0.5 line-clamp-1">
                {bolao?.subtitulo || '...Carregando'}
              </p>
            </div>
          </button>

          {/* Status do bolão - Compacto para mobile - COM ANIMAÇÃO SUAVE */}
          <div 
            className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg hover:scale-105 hover:bg-white/20 transition-all duration-300"
            style={{
              animation: 'gentleShake 4s ease-in-out infinite'
            }}
          >
            <div className={`w-3 h-3 rounded-full ${bolao?.esta_aberto ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs sm:text-sm font-bold text-green-950 whitespace-nowrap">
              {bolao?.esta_aberto ? 'ABERTO' : 'FECHADO'}
            </span>
          </div>
        </div>

        {/* Parte inferior: Botões de ação - Compacta */}
        <div className="flex flex-col sm:flex-row items-stretch bg-gradient-to-r from-green-800 to-emerald-800 border-t border-green-700/50">
          {/* WhatsApp - Ocupa toda largura em mobile, metade em desktop */}
          {bolao?.link_whatsapp && (
            <a
              href={bolao.link_whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:py-3 bg-gradient-to-r from-green-700 to-emerald-700 hover:from-green-600 hover:to-emerald-600 text-white transition-all group"
            >
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-xs sm:text-sm font-medium">Grupo WhatsApp</span>
            </a>
          )}

          {/* Botões do admin - Se for admin */}
          {isAdmin && (
            <div className="flex border-t border-green-700/50 sm:border-t-0 sm:border-l border-green-700/50">
              <button
                onClick={() => router.push('/admin')}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:py-3 bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-600 hover:to-purple-700 text-white transition-all group"
                title="Painel Administrativo"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Admin</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white transition-all group border-l border-gray-600/30"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Sair</span>
              </button>
            </div>
          )}

          {/* Se não for admin mas estiver logado, mostrar só botão sair */}
          {!isAdmin && user && (
            <div className="flex border-t border-green-700/50 sm:border-t-0 sm:border-l border-green-700/50">
              <button
                onClick={handleLogout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 sm:py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white transition-all group"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-medium">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Estilos para a animação suave */}
      <style jsx global>{`
        @keyframes gentleShake {
          0%, 95%, 100% { 
            transform: translateX(0) rotate(0deg); 
          }
          96% { 
            transform: translateX(-1px) rotate(-0.5deg); 
          }
          97% { 
            transform: translateX(1px) rotate(0.5deg); 
          }
          98% { 
            transform: translateX(-0.5px) rotate(-0.3deg); 
          }
          99% { 
            transform: translateX(0.5px) rotate(0.3deg); 
          }
        }
        
        /* Alternativa: tremores espaçados */
        @keyframes gentleShake2 {
          0%, 85%, 100% { 
            transform: translateX(0) rotate(0deg); 
          }
          86% { 
            transform: translateX(-1px) rotate(-0.3deg); 
          }
          88% { 
            transform: translateX(1px) rotate(0.3deg); 
          }
          90% { 
            transform: translateX(-0.5px) rotate(-0.2deg); 
          }
          92% { 
            transform: translateX(0.5px) rotate(0.2deg); 
          }
        }
        
        /* Alternativa: movimento único a cada ciclo */
        @keyframes gentleShake3 {
          0%, 90%, 100% { 
            transform: translateX(0) rotate(0deg); 
          }
          92%, 96% { 
            transform: translateX(-1px) rotate(-0.5deg); 
          }
          94%, 98% { 
            transform: translateX(1px) rotate(0.5deg); 
          }
        }
      `}</style>
    </header>
  );
}