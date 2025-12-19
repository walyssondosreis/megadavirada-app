'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao, Aposta } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
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
  Trophy,
  AlertCircle,
} from 'lucide-react';

export default function AdminPage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [apostas, setApostas] = useState<Aposta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);
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

  // Função para verificar se todas as apostas estão registradas
  const todasApostasRegistradas = () => {
    if (apostas.length === 0) return true; // Se não houver apostas, pode fechar
    return apostas.every(aposta => aposta.status === 'registrado');
  };

  // Função para contar apostas não registradas
  const contarApostasNaoRegistradas = () => {
    return apostas.filter(aposta => aposta.status !== 'registrado').length;
  };

  // Verifica se pode excluir aposta
  const podeExcluirAposta = (aposta: Aposta) => {
    // Não pode excluir se bolão estiver fechado
    if (!bolao?.esta_aberto) return false;
    // Não pode excluir se aposta estiver marcada como pago
    if (aposta.aposta_paga) return false;
    return true;
  };

  // Verifica se pode alterar status da aposta
  const podeAlterarStatusAposta = () => {
    // Não pode alterar status se bolão estiver fechado
    return bolao?.esta_aberto === true;
  };

  const toggleBolao = async () => {
    if (!bolao) return;

    // Se está tentando fechar o bolão, verificar se todas as apostas estão registradas
    if (bolao.esta_aberto && !todasApostasRegistradas()) {
      const naoRegistradas = contarApostasNaoRegistradas();
      alert(`Não é possível fechar o bolão! Existem ${naoRegistradas} aposta(s) não registrada(s).\n\nPor favor, marque todas as apostas como "Registrado" antes de fechar o bolão.`);
      return;
    }

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
    } else {
      alert('Erro ao salvar resultado');
    }
  };

  const updateApostaPaga = async (id: number, pago: boolean) => {
    // Verificar se pode alterar status
    if (!podeAlterarStatusAposta()) {
      alert('Não é possível alterar o status da aposta com o bolão fechado!');
      return;
    }

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
    // Verificar se pode alterar status
    if (!podeAlterarStatusAposta()) {
      alert('Não é possível alterar o status da aposta com o bolão fechado!');
      return;
    }

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
    const aposta = apostas.find(a => a.id === id);
    if (!aposta) return;

    // Verificar se pode excluir a aposta
    if (!podeExcluirAposta(aposta)) {
      let mensagem = '';
      if (!bolao?.esta_aberto) {
        mensagem = 'Não é possível excluir apostas com o bolão fechado!';
      } else if (aposta.aposta_paga) {
        mensagem = 'Não é possível excluir apostas que já foram marcadas como pagas!';
      }
      alert(mensagem);
      return;
    }

    if (!confirm('Deseja realmente excluir esta aposta?')) return;

    const { error } = await supabase.from('apostas').delete().eq('id', id);

    if (!error) {
      setApostas(apostas.filter((a) => a.id !== id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-200">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-200 to-gray-200 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-black hover:opacity-80 transition-opacity"
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
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
                    ? todasApostasRegistradas()
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
                disabled={bolao?.esta_aberto && !todasApostasRegistradas()}
              >
                {bolao?.esta_aberto ? (
                  <>
                    <Lock size={20} />
                    Fechar Bolão
                    {!todasApostasRegistradas() && (
                      <AlertCircle size={18} className="ml-1" />
                    )}
                  </>
                ) : (
                  <>
                    <Unlock size={20} />
                    Abrir Bolão
                  </>
                )}
              </button>
            </div>

            {/* Mensagem de alerta quando não puder fechar o bolão */}
            {bolao?.esta_aberto && !todasApostasRegistradas() && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Não é possível fechar o bolão!
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      Existem <span className="font-bold">{contarApostasNaoRegistradas()}</span> aposta(s) que precisam ser marcadas como <span className="font-bold">"Registrado"</span> antes de fechar o bolão.
                    </p>
                    <p className="text-xs text-yellow-600 mt-2">
                      Por favor, verifique todas as apostas abaixo e marque-as como "Registrado" quando confirmar que foram registradas oficialmente.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Seção de Resultado do Sorteio - Só aparece quando bolão está fechado */}
            {!bolao?.esta_aberto && (
              <div className="border-t border-gray-200 pt-6 mt-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy size={22} />
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
                      disabled={bolao?.esta_aberto}
                    />
                  </div>
                  <button
                    onClick={salvarResultado}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={bolao?.esta_aberto}
                  >
                    <Save size={18} />
                    Salvar Resultado
                  </button>
                  {bolao?.resultado && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        Resultado atual: <span className="font-bold">{bolao.resultado}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                Gerenciar Apostas ({apostas.length})
              </h2>
              {bolao?.esta_aberto && !todasApostasRegistradas() && (
                <div className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded-full font-medium">
                  {contarApostasNaoRegistradas()} não registrada(s)
                </div>
              )}
            </div>

            {apostas.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                Nenhuma aposta registrada
              </p>
            ) : (
              <div className="space-y-4">
                {apostas.map((aposta) => (
                  <div
                    key={aposta.id}
                    className={`border rounded-lg p-4 ${
                      aposta.status === 'registrado'
                        ? 'border-green-200 bg-green-50'
                        : aposta.status === 'pago'
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg text-black">
                          {aposta.nome_apostador
                          .trim()
                          .split(' ')
                          .map(palavra => 
                            palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase()
                          )
                          .join(' ')}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs sm:text-sm text-gray-500">
                            ID: #{aposta.id}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            aposta.status === 'registrado'
                              ? 'bg-green-100 text-green-800'
                              : aposta.status === 'pago'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {aposta.status === 'registrado' ? 'Registrado' : 
                             aposta.status === 'pago' ? 'Pago' : 'Pendente'}
                          </span>
                        </div>
                      </div>
                      {podeExcluirAposta(aposta) ? (
                        <button
                          onClick={() => deleteAposta(aposta.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir aposta"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          disabled
                          className="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                          title={
                            !bolao?.esta_aberto 
                              ? "Não é possível excluir com bolão fechado" 
                              : aposta.aposta_paga 
                                ? "Não é possível excluir apostas pagas" 
                                : "Não é possível excluir"
                          }
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
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
                        } ${!podeAlterarStatusAposta() ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={!podeAlterarStatusAposta()}
                        title={!podeAlterarStatusAposta() ? "Não é possível alterar status com bolão fechado" : ""}
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
                          } ${!podeAlterarStatusAposta() ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={!podeAlterarStatusAposta()}
                          title={!podeAlterarStatusAposta() ? "Não é possível alterar status com bolão fechado" : ""}
                        >
                          <CheckCircle size={16} />
                          {aposta.aposta_registrada
                            ? 'Registrado ✓'
                            : 'Marcar como Registrado'}
                        </button>
                      )}
                    </div>

                    {/* Mensagem informativa quando bolão está fechado */}
                    {!bolao?.esta_aberto && (
                      <div className="mt-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                        <span className="font-medium">Status bloqueado:</span> Não é possível alterar status das apostas com o bolão fechado.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <footer className="mt-6 text-center text-black text-sm">
            <a 
  href="https://inov4dev-app.vercel.app/" 
  target="_blank" 
  rel="noopener noreferrer"
  className="hover:text-yellow-300 transition-colors"
>
  Inov4Dev © {new Date().getFullYear()}
</a>
          </footer>
        </div>
      </div>
    </>
  );
}