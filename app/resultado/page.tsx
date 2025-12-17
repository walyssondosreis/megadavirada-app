'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Bolao, Aposta } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import { Trophy, Award, Frown, ArrowLeft, Search } from 'lucide-react';

interface ApostaComAcertos extends Aposta {
  acertos_jogo1: number;
  acertos_jogo2: number;
  total_acertos: number;
  ganhou: boolean;
}

export default function ResultadoPage() {
  const [bolao, setBolao] = useState<Bolao | null>(null);
  const [apostasComAcertos, setApostasComAcertos] = useState<ApostaComAcertos[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const filteredApostas = useMemo(() => {
    if (!searchTerm) return apostasComAcertos;
    return apostasComAcertos.filter(aposta => 
      aposta.nome_apostador.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [apostasComAcertos, searchTerm]);

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

        if (!bolaoData.resultado) {
          router.push('/');
          return;
        }

        const { data: apostasData } = await supabase
          .from('apostas')
          .select('*')
          .eq('bolao_id', bolaoData.id);

        if (apostasData) {
          // Ordenar os números do resultado
          const resultado = bolaoData.resultado.split('-').map(Number).sort((a: number, b: number) => a - b);
          // const resultado = bolaoData.resultado.split('-').map(Number).sort((a, b) => a - b);
          
          const apostasProcessadas = apostasData.map((aposta) => {
            const jogo1 = aposta.jogo_1.split(',').map(Number);
            const jogo2 = aposta.jogo_2.split(',').map(Number);

            const acertos_jogo1 = jogo1.filter((num: number) => resultado.includes(num)).length;
            const acertos_jogo2 = jogo2.filter((num: number) => resultado.includes(num)).length;
            const total_acertos = Math.max(acertos_jogo1, acertos_jogo2);
            const ganhou = acertos_jogo1 >= 4 || acertos_jogo2 >= 4;

            return {
              ...aposta,
              acertos_jogo1,
              acertos_jogo2,
              total_acertos,
              ganhou,
            };
          });

          // Ordenar por maior número de acertos
          apostasProcessadas.sort((a, b) => b.total_acertos - a.total_acertos);
          setApostasComAcertos(apostasProcessadas);
        }
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderNumeros = (numerosStr: string, resultadoArr: number[], acertos: number) => {
    const numeros = numerosStr.split(',').map(Number);
    
    return (
      <div className="flex flex-wrap gap-2">
        {numeros.map((num, idx) => {
          const acertou = resultadoArr.includes(num);
          return (
            <span
              key={idx}
              className={`w-9 h-9 flex items-center justify-center text-sm font-bold rounded-full ${
                acertou
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-300 text-gray-600'
              }`}
            >
              {num.toString().padStart(2, '0')}
            </span>
          );
        })}
        <span className="ml-2 px-3 py-1 bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
          {acertos} acerto{acertos !== 1 ? 's' : ''}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  if (!bolao?.resultado) {
    return null;
  }

  // Ordenar números do resultado
  const resultado = bolao.resultado.split('-').map(Number).sort((a, b) => a - b);
  const vencedores = apostasComAcertos.filter(a => a.ganhou);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-blue-600 py-4 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-white mb-4 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>

          {/* Header com Resultado */}
          <div className="bg-white rounded-xl shadow-2xl p-6 mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="text-yellow-500" size={40} />
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Resultado - {bolao.titulo}
              </h1>
            </div>
            
            <p className="text-gray-600 mb-4">Concurso {bolao.concurso}</p>

            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-3">Números Sorteados:</p>
              <div className="flex justify-center flex-wrap gap-3">
                {resultado.map((num, idx) => (
                  <span
                    key={idx}
                    className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-lg font-bold rounded-full shadow-lg"
                  >
                    {num.toString().padStart(2, '0')}
                  </span>
                ))}
              </div>
            </div>

            {vencedores.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-500 rounded-lg">
                <p className="text-green-800 font-bold text-lg">
                  🎉 {vencedores.length} Ganhador{vencedores.length !== 1 ? 'es' : ''}!
                </p>
              </div>
            )}
          </div>

          {/* Ranking de Apostas */}
          <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="text-purple-600" size={24} />
              Ranking de Apostas
            </h2>

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
                {searchTerm ? 'Nenhuma aposta encontrada com esse nome' : 'Nenhuma aposta encontrada'}
              </p>
            ) : (
              <div className="space-y-4">
                {filteredApostas.map((aposta, index) => {
                  const originalIndex = apostasComAcertos.findIndex(a => a.id === aposta.id);
                  return (
                    <div
                      key={aposta.id}
                      className={`border-2 rounded-lg p-4 ${
                        aposta.ganhou
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            originalIndex === 0 ? 'bg-yellow-400 text-white' :
                            originalIndex === 1 ? 'bg-gray-400 text-white' :
                            originalIndex === 2 ? 'bg-orange-600 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {originalIndex + 1}º
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {aposta.nome_apostador}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {aposta.total_acertos} acerto{aposta.total_acertos !== 1 ? 's' : ''} no melhor jogo
                            </p>
                          </div>
                        </div>

                        {aposta.ganhou ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold">
                            <Trophy size={18} />
                            GANHOU
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg font-bold">
                            <Frown size={18} />
                            PERDEU
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Jogo 1 ({aposta.acertos_jogo1} acertos):
                          </p>
                          {renderNumeros(aposta.jogo_1, resultado, aposta.acertos_jogo1)}
                        </div>

                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Jogo 2 ({aposta.acertos_jogo2} acertos):
                          </p>
                          {renderNumeros(aposta.jogo_2, resultado, aposta.acertos_jogo2)}
                        </div>
                      </div>

                      {aposta.mensagem && (
                        <div className="mt-4 p-3 bg-gray-100 rounded-lg">
                          <p className="text-sm text-gray-700 italic">
                            "{aposta.mensagem}"
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <footer className="mt-6 text-center text-white text-sm">
            by @walyssondosreis
          </footer>
        </div>
      </div>
    </>
  );
}