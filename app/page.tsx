'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao, Aposta } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, LogIn, Settings, Trophy, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function HomePage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Buscar bolão ativo
      const { data: bolaoData } = await supabase
        .from('boloes')
        .select('*')
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (bolaoData) {
        setBolao(bolaoData);

        // Buscar apostas do bolão
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
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="text-purple-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {bolao?.titulo || 'Mega da Virada'}
                </h1>
                <p className="text-sm text-gray-600">{bolao?.subtitulo}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <Settings size={18} />
                  Admin
                </button>
              )}
              {user ? (
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Sair
                </button>
              ) : (
                <button
                  onClick={() => router.push('/login')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <LogIn size={18} />
                  Login Admin
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {apostas.length}
              </div>
              <div className="text-gray-600">Apostas Realizadas</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                R$ {bolao?.valor_cota.toFixed(2)}
              </div>
              <div className="text-gray-600">Valor por Cota</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {bolao?.concurso}
              </div>
              <div className="text-gray-600">Concurso</div>
            </div>
          </div>

          {bolao?.esta_aberto && (
            <button
              onClick={() => router.push('/nova-aposta')}
              className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              <Plus size={20} />
              Fazer Nova Aposta
            </button>
          )}

          {!bolao?.esta_aberto && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
              <p className="text-red-800 font-semibold">
                Bolão fechado para novas apostas
              </p>
            </div>
          )}
        </div>

        {/* Apostas List */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Users size={24} />
            Apostas Registradas
          </h2>

          {apostas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma aposta realizada ainda
            </p>
          ) : (
            <div className="space-y-4">
              {apostas.map((aposta) => (
                <div
                  key={aposta.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {aposta.nome_apostador}
                      </h3>
                      <p className="text-sm text-gray-500">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Jogo 1:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aposta.jogo_1.split(',').map((num, idx) => (
                          <span
                            key={idx}
                            className="w-10 h-10 flex items-center justify-center bg-green-600 text-white font-bold rounded-full"
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
                            className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white font-bold rounded-full"
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
      </main>
    </div>
  );
}