'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao, Aposta } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Check,
  X,
  Edit,
  Trash2,
  Lock,
  Unlock,
  Settings,
  DollarSign,
  CheckCircle,
} from 'lucide-react';

export default function AdminPage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const router = useRouter();
  const { isAdmin, user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/');
      return;
    }
    loadData();
  }, [isAdmin, user]);

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

        const { data: apostasData } = await supabase
          .from('apostas')
          .select('*')
          .eq('bolao_id', bolaoData.id)
          .order('created_at', { ascending: false });

        setApostas(apostasData || []);
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBolao = async () => {
    if (!bolao) return;

    const { error } = await supabase
      .from('boloes')
      .update({ esta_aberto: !bolao.esta_aberto })
      .eq('id', bolao.id);

    if (!error) {
      setBolao({ ...bolao, esta_aberto: !bolao.esta_aberto });
    }
  };

  const updateApostaPaga = async (id: number, pago: boolean) => {
    const newStatus = pago ? 'pago' : 'pendente';
    const { error } = await supabase
      .from('apostas')
      .update({ aposta_paga: pago, status: newStatus })
      .eq('id', id);

    if (!error) {
      setApostas(
        apostas.map((a) =>
          a.id === id ? { ...a, aposta_paga: pago, status: newStatus } : a
        )
      );
    }
  };

  const updateApostaRegistrada = async (id: number, registrado: boolean) => {
    const newStatus = registrado ? 'registrado' : 'pago';
    const { error } = await supabase
      .from('apostas')
      .update({ aposta_registrada: registrado, status: newStatus })
      .eq('id', id);

    if (!error) {
      setApostas(
        apostas.map((a) =>
          a.id === id
            ? { ...a, aposta_registrada: registrado, status: newStatus }
            : a
        )
      );
    }
  };

  const deleteAposta = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta aposta?')) return;

    const { error } = await supabase.from('apostas').delete().eq('id', id);

    if (!error) {
      setApostas(apostas.filter((a) => a.id !== id));
    }
  };

  const updateLinkWhatsApp = async (link: string) => {
    if (!bolao) return;

    const { error } = await supabase
      .from('boloes')
      .update({ link_whatsapp: link })
      .eq('id', bolao.id);

    if (!error) {
      setBolao({ ...bolao, link_whatsapp: link });
      alert('Link do WhatsApp atualizado!');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>

        {showConfig && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Configurações do Bolão
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link do Grupo WhatsApp
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    defaultValue={bolao?.link_whatsapp || ''}
                    id="whatsapp-link"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600"
                    placeholder="https://chat.whatsapp.com/..."
                  />
                  <button
                    onClick={() => {
                      const input = document.getElementById(
                        'whatsapp-link'
                      ) as HTMLInputElement;
                      updateLinkWhatsApp(input.value);
                    }}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-gray-600">Gerencie apostas e configurações</p>
            </div>
            <button
              onClick={toggleBolao}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                bolao?.esta_aberto
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {bolao?.esta_aberto ? (
                <>
                  <Lock size={20} />
                  Fechar Bolão
                </>
              ) : (
                <>
                  <Unlock size={20} />
                  Abrir Bolão
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Gerenciar Apostas ({apostas.length})
          </h2>

          {apostas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Nenhuma aposta registrada
            </p>
          ) : (
            <div className="space-y-4">
              {apostas.map((aposta) => (
                <div
                  key={aposta.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {aposta.nome_apostador}
                      </h3>
                      <p className="text-sm text-gray-500">
                        ID: #{aposta.id} | Status: {aposta.status}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteAposta(aposta.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Jogo 1:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {aposta.jogo_1.split(',').map((num, idx) => (
                          <span
                            key={idx}
                            className="w-8 h-8 flex items-center justify-center bg-green-600 text-white text-sm font-bold rounded-full"
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
                            className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white text-sm font-bold rounded-full"
                          >
                            {num.padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        updateApostaPaga(aposta.id, !aposta.aposta_paga)
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        aposta.aposta_paga
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      <DollarSign size={16} />
                      {aposta.aposta_paga ? 'Pago ✓' : 'Marcar como Pago'}
                    </button>

                    {aposta.aposta_paga && (
                      <button
                        onClick={() =>
                          updateApostaRegistrada(
                            aposta.id,
                            !aposta.aposta_registrada
                          )
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                          aposta.aposta_registrada
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <CheckCircle size={16} />
                        {aposta.aposta_registrada
                          ? 'Registrado ✓'
                          : 'Marcar como Registrado'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}