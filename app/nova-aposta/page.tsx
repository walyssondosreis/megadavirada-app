'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao } from '@/lib/supabase';
import NumberSelector from '@/components/NumberSelector';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Check, Share2, Copy } from 'lucide-react';

export default function NovaApostaPage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [nomeApostador, setNomeApostador] = useState('');
  const [jogo1, setJogo1] = useState<number[]>([]);
  const [jogo2, setJogo2] = useState<number[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
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
        router.push('/');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors: string[] = [];

    if (!nomeApostador.trim()) {
      validationErrors.push('Por favor, informe seu nome completo');
    }

    if (jogo1.length !== 6) {
      validationErrors.push('Selecione exatamente 6 números para o Jogo 1');
    }

    if (jogo2.length !== 6) {
      validationErrors.push('Selecione exatamente 6 números para o Jogo 2');
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!bolao) {
      return;
    }

    setLoading(true);
    setErrors([]);

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
      setErrors(['Erro ao salvar aposta. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  const copyPixKey = async () => {
    if (!bolao?.chave_pix) return;
    
    try {
      await navigator.clipboard.writeText(bolao.chave_pix);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar');
    }
  };

  const shareWhatsApp = () => {
    const jogo1Text = jogo1.map(n => n.toString().padStart(2, '0')).join(' - ');
    const jogo2Text = jogo2.map(n => n.toString().padStart(2, '0')).join(' - ');
    
    const message = `🎰 *Aposta Registrada - ${bolao?.titulo || 'Bolão'}*\n\n` +
      `👤 *Nome:* ${nomeApostador}\n\n` +
      `🎲 *Jogo 1:* ${jogo1Text}\n` +
      `🎲 *Jogo 2:* ${jogo2Text}\n` +
      `${mensagem ? `\n💬 *Mensagem:* ${mensagem}` : ''}\n\n` +
      `✅ Aposta confirmada!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (showSuccess) {
    return (
      <>
        <Navbar />
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

            {bolao?.chave_pix && (
              <div className="mb-6 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Realize o pagamento via PIX:
                </p>
                <button
                  type="button"
                  onClick={copyPixKey}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <Copy size={18} />
                  {copiedPix ? 'Chave Copiada!' : 'Copiar Chave PIX'}
                </button>
                <p className="text-xs text-gray-600 mt-2 break-all">
                  {bolao.chave_pix}
                </p>
                <p className="text-sm font-bold text-blue-700 mt-2">
                  Valor: R$ {bolao.valor_cota.toFixed(2)}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                <Share2 size={20} />
                Compartilhar no WhatsApp
              </button>
              <button
                type="button"
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
              >
                Ver Todas as Apostas
              </button>
            </div>

            <footer className="mt-8 text-gray-500 text-sm">
              by @walyssondosreis
            </footer>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>

          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 text-center">
              Nova Aposta - {bolao?.titulo}
            </h1>

            {errors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx} className="text-red-800 text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nomeApostador}
                  onChange={(e) => setNomeApostador(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Digite seu nome completo"
                  style={{ color: '#111827' }}
                />
              </div>

              <div className="border-t pt-4">
                <NumberSelector
                  selectedNumbers={jogo1}
                  onNumbersChange={setJogo1}
                  label="Jogo 1 - Selecione 6 números"
                />
              </div>

              <div className="border-t pt-4">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                  placeholder="Deixe uma mensagem personalizada..."
                  rows={3}
                  maxLength={100}
                  style={{ color: '#111827' }}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {mensagem.length}/100 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-bold text-lg"
              >
                {loading ? 'Salvando...' : 'Confirmar Aposta'}
              </button>
            </form>
          </div>

          <footer className="mt-6 text-center text-white text-sm">
            by @walyssondosreis
          </footer>
        </div>
      </div>
    </>
  );
}