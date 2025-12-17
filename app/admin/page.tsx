'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao, Aposta } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft,
  Trash2,
  Lock,
  Unlock,
  Settings,
  DollarSign,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Save,
} from 'lucide-react';

export default function AdminPage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
  const [showResultado, setShowResultado] = useState(false);
  const [resultado, setResultado] = useState('');
  
  const [editTitulo, setEditTitulo] = useState('');
  const [editSubtitulo, setEditSubtitulo] = useState('');
  const [editConcurso, setEditConcurso] = useState('');
  const [editValorCota, setEditValorCota] = useState('');
  const [editLinkWhatsapp, setEditLinkWhatsapp] = useState('');
  const [editChavePix, setEditChavePix] = useState('');
  
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
        setEditTitulo(bolaoData.titulo);
        setEditSubtitulo(bolaoData.subtitulo || '');
        setEditConcurso(bolaoData.concurso.toString());
        setEditValorCota(bolaoData.valor_cota.toString());
        setEditLinkWhatsapp(bolaoData.link_whatsapp || '');
        setEditChavePix(bolaoData.chave_pix || '');
        setResultado(bolaoData.resultado || '');

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

    const novoStatus = !bolao.esta_aberto;
    
    // Se está reabrindo o bolão, apagar o resultado
    const updateData: any = { esta_aberto: novoStatus };
    if (novoStatus) {
      updateData.resultado = null;
      setResultado('');
    }

    const { error } = await supabase
      .from('boloes')
      .update(updateData)
      .eq('id', bolao.id);

    if (!error) {
      setBolao({ ...bolao, esta_aberto: novoStatus, resultado: novoStatus ? null : bolao.resultado });
      if (!novoStatus) {
        setShowResultado(true);
      }
    }
  };

  const salvarConfiguracoes = async () => {
    if (!bolao) return;

    const { error } = await supabase
      .from('boloes')
      .update({
        titulo: editTitulo,
        subtitulo: editSubtitulo,
        concurso: parseInt(editConcurso),
        valor_cota: parseFloat(editValorCota),
        link_whatsapp: editLinkWhatsapp,
        chave_pix: editChavePix || null,
      })
      .eq('id', bolao.id);

    if (!error) {
      alert('Configurações salvas com sucesso!');
      loadData();
    } else {
      alert('Erro ao salvar configurações');
    }
  };

  const salvarResultado = async () => {
    if (!bolao) return;

    const regex = /^\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}-\d{1,2}$/;
    if (!regex.test(resultado)) {
      alert('Formato inválido! Use o formato: 1-2-3-4-5-6');
      return;
    }

    const { error } = await supabase
      .from('boloes')
      .update({ resultado })
      .eq('id', bolao.id);

    if (!error) {
      alert('Resultado salvo com sucesso!');
      setBolao({ ...bolao, resultado });
      setShowResultado(false);
    } else {
      alert('Erro ao salvar resultado');
    }
  };

  const updateApostaPaga = async (id: number, pago: boolean) => {
    const aposta = apostas.find(a => a.id === id);
    if (!aposta) return;

    let newStatus: 'pendente' | 'pago' | 'registrado';
    let newRegistrada = aposta.aposta_registrada;

    if (!pago) {
      newStatus = 'pendente';
      newRegistrada = false;
    } else {
      newStatus = 'pago';
    }

    const { error } = await supabase
      .from('apostas')
      .update({ 
        aposta_paga: pago, 
        aposta_registrada: newRegistrada,
        status: newStatus 
      })
      .eq('id', id);

    if (!error) {
      setApostas(
        apostas.map((a) =>
          a.id === id ? { ...a, aposta_paga: pago, aposta_registrada: newRegistrada, status: newStatus } : a
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-4 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors text-sm"
          >
            <Settings size={18} />
            {showConfig ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        {showConfig && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Configurações do Bolão
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título do Bolão
                </label>
                <input
                  type="text"
                  value={editTitulo}
                  onChange={(e) => setEditTitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                  placeholder="Ex: Mega da Virada 2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subtítulo
                </label>
                <input
                  type="text"
                  value={editSubtitulo}
                  onChange={(e) => setEditSubtitulo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                  placeholder="Ex: Concorra a prêmios milionários!"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Concurso
                  </label>
                  <input
                    type="number"
                    value={editConcurso}
                    onChange={(e) => setEditConcurso(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                    placeholder="2810"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor da Cota (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editValorCota}
                    onChange={(e) => setEditValorCota(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                    placeholder="25.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Link do Grupo WhatsApp
                </label>
                <input
                  type="url"
                  value={editLinkWhatsapp}
                  onChange={(e) => setEditLinkWhatsapp(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX para Pagamento
                </label>
                <input
                  type="text"
                  value={editChavePix}
                  onChange={(e) => setEditChavePix(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                  placeholder="email@exemplo.com ou CPF ou telefone"
                />
              </div>

              <button
                onClick={salvarConfiguracoes}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Save size={18} />
                Salvar Configurações
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Painel Administrativo
              </h1>
              <p className="text-sm text-gray-600">Gerencie apostas e configurações</p>
            </div>
            <button
              onClick={toggleBolao}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
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

        {showResultado && (
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
              Lançar Resultado do Sorteio
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Números Sorteados (formato: 1-2-3-4-5-6)
                </label>
                <input
                  type="text"
                  value={resultado}
                  onChange={(e) => setResultado(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 text-gray-900 bg-white"
                  placeholder="1-2-3-4-5-6"
                />
              </div>
              <button
                onClick={salvarResultado}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Salvar Resultado
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
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
                      <h3 className="font-semibold text-base sm:text-lg">
                        {aposta.nome_apostador}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
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

                  <div className="grid grid-cols-1 gap-4 mb-4">
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
                            className="w-8 h-8 flex items-center justify-center bg-green-600 text-white text-sm font-bold rounded-full"
                          >
                            {num.padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() =>
                        updateApostaPaga(aposta.id, !aposta.aposta_paga)
                      }
                      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
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
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm ${
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

        <footer className="mt-6 text-center text-white text-sm">
          by @walyssondosreis
        </footer>
      </div>
    </div>
  );
}