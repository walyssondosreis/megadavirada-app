'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao, Aposta } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, LogIn, Settings, Trophy, Users, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function HomePage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: bolaoData } = await supabase
        .from('boloes')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (bolaoData) {
        setBolao(bolaoData);

        if (bolaoData.resultado) {
          router.push('/resultado');
          return;
        }

        const { data: apostasData } = await supabase
          .from('apostas')
          .select('*')
          .eq('bolao_id', bolaoData.id)
          .order('created_at', { ascending: false });

        setApostas(apostasData || []);
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApostas = useMemo(() => {
    if (!searchTerm) return apostas;
    return apostas.filter(aposta => 
      aposta.nome_apostador.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apostas, searchTerm]);

  const totalCotas = apostas.length;
  const totalJogos = totalCotas * 2;
  const valorTotal = totalCotas * (bolao?.valor_cota || 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'pago':
        return 'bg-blue-100 text-blue-800';
      case 'registrado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'pago':
        return 'Pago';
      case 'registrado':
        return 'Registrado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-purple-600" size={32} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {bolao?.titulo || 'Mega da Virada'}
                </h1>
                <p className="text-sm text-gray-600">{bolao?.subtitulo}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
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
                <button
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

      <main className="max-w-4xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                R$ {bolao?.valor_cota.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Valor/Cota (2 jogos)</div>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {bolao?.concurso}
              </div>
              <div className="text-sm text-gray-600">Concurso</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
              📊 Total do Bolão
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-xl font-bold text-green-700">{totalCotas}</div>
                <div className="text-xs text-gray-600">Cotas</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-700">{totalJogos}</div>
                <div className="text-xs text-gray-600">Jogos</div>
              </div>
              <div>
                <div className="text-xl font-bold text-green-700">
                  R$ {valorTotal.toFixed(2)}
                </div>
                <div className="text-xs text-gray-600">Investido</div>
              </div>
            </div>
          </div>

          {bolao?.esta_aberto && (
            <button
              onClick={() => router.push('/nova-aposta')}
              className="w-full mt-4 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Plus size={20} />
              Fazer Nova Aposta
            </button>
          )}

          {!bolao?.esta_aberto && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-800 font-semibold">
                Bolão fechado para novas apostas
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users size={24} />
              Apostas Registradas
            </h2>
          </div>

          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                placeholder="Buscar por nome..."
              />
            </div>
          </div>

          {filteredApostas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {searchTerm ? 'Nenhuma aposta encontrada com esse nome' : 'Nenhuma aposta realizada ainda'}
            </p>
          ) : (
            <div className="space-y-4">
              {filteredApostas.map((aposta) => (
                <div
                  key={aposta.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900">
                        {aposta.nome_apostador}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {format(new Date(aposta.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        aposta.status
                      )}`}
                    >
                      {getStatusText(aposta.status)}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Jogo 1:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aposta.jogo_1.split(',').map((num, idx) => (
                          <span
                            key={idx}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-green-600 text-white font-bold rounded-full text-sm"
                          >
                            {num.padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Jogo 2:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aposta.jogo_2.split(',').map((num, idx) => (
                          <span
                            key={idx}
                            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-green-600 text-white font-bold rounded-full text-sm"
                          >
                            {num.padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {aposta.mensagem && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">
                        "{aposta.mensagem}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-white text-sm">
          by @walyssondosreis
        </footer>
      </main>
    </div>
  );
}