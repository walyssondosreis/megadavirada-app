'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao } from '@/lib/supabase';
import NumberSelector from '@/components/NumberSelector';
import { ArrowLeft, Check, Share2 } from 'lucide-react';

export default function NovaApostaPage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [nomeApostador, setNomeApostador] = useState('');
  const [jogo1, setJogo1] = useState<number[]>([]);
  const [jogo2, setJogo2] = useState<number[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    loadBolao();
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
      if (!data.esta_aberto) {
        alert('Bolão fechado para novas apostas');
        router.push('/');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomeApostador.trim()) {
      alert('Por favor, informe seu nome completo');
      return;
    }

    if (jogo1.length !== 6) {
      alert('Selecione 6 números para o Jogo 1');
      return;
    }

    if (jogo2.length !== 6) {
      alert('Selecione 6 números para o Jogo 2');
      return;
    }

    if (!bolao) {
      alert('Bolão não encontrado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('apostas').insert({
        nome_apostador: nomeApostador.trim(),
        jogo_1: jogo1.join(','),
        jogo_2: jogo2.join(','),
        mensagem: mensagem.trim() || null,
        bolao_id: bolao.id,
        status: 'pendente',
        aposta_paga: false,
        aposta_registrada: false,
      });

      if (error) throw error;

      setShowSuccess(true);
    } catch (err) {
      console.error('Erro ao salvar aposta:', err);
      alert('Erro ao salvar aposta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const shareWhatsApp = () => {
    if (!bolao?.link_whatsapp) {
      alert('Link do WhatsApp não configurado');
      return;
    }

    const message = `🎰 Aposta registrada!\n\n` +
      `Apostador: ${nomeApostador}\n` +
      `Jogo 1: ${jogo1.map(n => n.toString().padStart(2, '0')).join(', ')}\n` +
      `Jogo 2: ${jogo2.map(n => n.toString().padStart(2, '0')).join(', ')}\n` +
      `${mensagem ? `\nMensagem: ${mensagem}` : ''}`;

    window.open(bolao.link_whatsapp, '_blank');
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="text-green-600" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Aposta Registrada!
          </h2>
          <p className="text-gray-600 mb-6">
            Sua aposta foi salva com sucesso. Boa sorte!
          </p>

          <div className="space-y-3">
            {bolao?.link_whatsapp && (
              <button
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Share2 size={20} />
                Compartilhar no WhatsApp
              </button>
            )}
            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              Ver Todas as Apostas
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-white mb-6 hover:opacity-80 transition-opacity"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Nova Aposta - {bolao?.titulo}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={nomeApostador}
                onChange={(e) => setNomeApostador(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Digite seu nome completo"
                required
              />
            </div>

            <div className="border-t pt-6">
              <NumberSelector
                selectedNumbers={jogo1}
                onNumbersChange={setJogo1}
                label="Jogo 1 - Selecione 6 números"
              />
            </div>

            <div className="border-t pt-6">
              <NumberSelector
                selectedNumbers={jogo2}
                onNumbersChange={setJogo2}
                label="Jogo 2 - Selecione 6 números"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensagem (Opcional)
              </label>
              <textarea
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Deixe uma mensagem personalizada..."
                rows={3}
                maxLength={100}
              />
              <p className="text-sm text-gray-500 mt-1">
                {mensagem.length}/100 caracteres
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || jogo1.length !== 6 || jogo2.length !== 6}
              className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-lg"
            >
              {loading ? 'Salvando...' : 'Confirmar Aposta'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}