// components/ShareCard.tsx
'use client';

import { Share2, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, Bolao } from '@/lib/supabase';

interface ShareCardProps {
  nomeApostador: string;
  jogo1: string;
  jogo2: string;
  mensagem?: string;
  resultado?: string; // Resultado do sorteio (opcional)
  posicao?: number; // Posição no ranking (opcional)
  concurso?: string; // Número do concurso (opcional)
  estaAberto?: boolean; // Se o bolão ainda está aberto (para apostas novas)
  onShare?: (imageUrl: string) => void; // Callback opcional
}

export default function ShareCard({
  nomeApostador,
  jogo1,
  jogo2,
  mensagem,
  resultado,
  posicao,
  concurso = '1',
  estaAberto = false,
  onShare
}: ShareCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bolao, setBolao] = useState<Bolao | null>(null);

  useEffect(() => {
    loadBolao();
      
    // Recarregar a cada 5 segundos para pegar atualizações
    const interval = setInterval(loadBolao, 5000);
    return () => clearInterval(interval);
  }, []);
  
  // Processar resultado se existir
  const resultadoNumeros = resultado 
    ? resultado.split('-').map(Number).sort((a, b) => a - b)
    : [];
  
  // Calcular acertos se houver resultado
  const calcularAcertos = (numerosStr: string) => {
    if (!resultado) return 0;
    const numeros = numerosStr.split(',').map(Number);
    return numeros.filter(num => resultadoNumeros.includes(num)).length;
  };

  const acertosJogo1 = calcularAcertos(jogo1);
  const acertosJogo2 = calcularAcertos(jogo2);
  const totalAcertos = Math.max(acertosJogo1, acertosJogo2);
  const ganhou = resultado ? (acertosJogo1 >= 4 || acertosJogo2 >= 4) : false;
 
  // Carrega informações do banco
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

  // Função para gerar imagem usando Canvas API
  const gerarImagemDoCard = async () => {
    try {
      // Criar canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Não foi possível criar contexto do canvas');
      }
      
      // Configurar dimensões (tamanho mobile)
      const width = 375;
      const height = estaAberto ? 650 : 700;
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
      
      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // Gradiente de fundo do header
      const gradient = ctx.createLinearGradient(0, 0, width, 80);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      
      // Header
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 80);
      
      // Texto do header
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${bolao?.titulo}`, width / 2, 35);
      
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText(`Concurso ${concurso}`, width / 2, 60);
      
      let currentY = 100;
      
      // Posição no ranking (se houver)
      if (posicao && !estaAberto) {
        ctx.fillStyle = posicao === 1 ? '#fef3c7' : 
                       posicao === 2 ? '#ffedd5' : '#f3f4f6';
        ctx.fillRect(width / 2 - 60, currentY, 120, 40);
        ctx.strokeStyle = posicao === 1 ? '#f59e0b' : 
                         posicao === 2 ? '#ea580c' : '#6b7280';
        ctx.lineWidth = 2;
        ctx.strokeRect(width / 2 - 60, currentY, 120, 40);
        
        ctx.fillStyle = posicao === 1 ? '#92400e' : 
                       posicao === 2 ? '#9a3412' : '#374151';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${posicao}º LUGAR`, width / 2, currentY + 26);
        
        currentY += 70;
      }
      
      // Nome do apostador
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      
      // Truncar nome se for muito longo
      let nomeDisplay = nomeApostador;
      if (ctx.measureText(nomeDisplay).width > width - 40) {
        while (ctx.measureText(nomeDisplay + '...').width > width - 40 && nomeDisplay.length > 10) {
          nomeDisplay = nomeDisplay.slice(0, -1);
        }
        nomeDisplay += '...';
      }
      
      ctx.fillText(nomeDisplay, 20, currentY);
      
      // Texto abaixo do nome
      ctx.fillStyle = '#6b7280';
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      
      if (resultado) {
        ctx.fillText(`${totalAcertos} acerto${totalAcertos !== 1 ? 's' : ''} no melhor jogo`, 20, currentY + 25);
        currentY += 50;
      } else {
        ctx.fillText('Nova aposta registrada', 20, currentY + 25);
        currentY += 50;
      }
      
      // Status (apenas se tiver resultado)
      if (resultado) {
        ctx.fillStyle = ganhou ? '#10b981' : '#9ca3af';
        ctx.fillRect(20, currentY, 150, 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ganhou ? '🏆 GANHOU' : '😞 PERDEU', 95, currentY + 26);
        
        currentY += 70;
      }
      
      // Calcular espaço entre números
      const numSize = 36;
      const numSpacing = 8;
      const numsPerRow = 6;
      const rowWidth = (numsPerRow * numSize) + ((numsPerRow - 1) * numSpacing);
      const startX = (width - rowWidth) / 2;
      
      // Jogo 1
      ctx.fillStyle = '#4b5563';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      
      if (resultado) {
        ctx.fillText(`Jogo 1 (${acertosJogo1} acertos):`, 20, currentY);
      } else {
        ctx.fillText('Jogo 1:', 20, currentY);
      }
      
      currentY += 25;
      
      const numerosJogo1 = jogo1.split(',').map(Number);
      
      for (let i = 0; i < numerosJogo1.length; i++) {
        const row = Math.floor(i / numsPerRow);
        const col = i % numsPerRow;
        const x = startX + col * (numSize + numSpacing);
        const y = currentY + row * (numSize + numSpacing);
        
        const acertou = resultadoNumeros.includes(numerosJogo1[i]);
        ctx.fillStyle = resultado ? (acertou ? '#10b981' : '#d1d5db') : '#10b981';
        ctx.beginPath();
        ctx.arc(x + numSize/2, y + numSize/2, numSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        if (resultado && acertou) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
        }
        
        ctx.fillStyle = resultado ? (acertou ? '#ffffff' : '#4b5563') : '#ffffff';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(numerosJogo1[i].toString().padStart(2, '0'), x + numSize/2, y + numSize/2 + 4);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Acertos jogo 1 (apenas se tiver resultado)
      if (resultado) {
        currentY += (Math.ceil(numerosJogo1.length / numsPerRow) * (numSize + numSpacing)) + 15;
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.roundRect(width/2 - 50, currentY, 100, 30, 15);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${acertosJogo1} acerto${acertosJogo1 !== 1 ? 's' : ''}`, width/2, currentY + 20);
        
        currentY += 60;
      } else {
        currentY += (Math.ceil(numerosJogo1.length / numsPerRow) * (numSize + numSpacing)) + 40;
      }
      
      // Jogo 2
      ctx.fillStyle = '#4b5563';
      ctx.font = '600 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      
      if (resultado) {
        ctx.fillText(`Jogo 2 (${acertosJogo2} acertos):`, 20, currentY);
      } else {
        ctx.fillText('Jogo 2:', 20, currentY);
      }
      
      currentY += 25;
      
      const numerosJogo2 = jogo2.split(',').map(Number);
      
      for (let i = 0; i < numerosJogo2.length; i++) {
        const row = Math.floor(i / numsPerRow);
        const col = i % numsPerRow;
        const x = startX + col * (numSize + numSpacing);
        const y = currentY + row * (numSize + numSpacing);
        
        const acertou = resultadoNumeros.includes(numerosJogo2[i]);
        ctx.fillStyle = resultado ? (acertou ? '#10b981' : '#d1d5db') : '#10b981';
        ctx.beginPath();
        ctx.arc(x + numSize/2, y + numSize/2, numSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        if (resultado && acertou) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 4;
        }
        
        ctx.fillStyle = resultado ? (acertou ? '#ffffff' : '#4b5563') : '#ffffff';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(numerosJogo2[i].toString().padStart(2, '0'), x + numSize/2, y + numSize/2 + 4);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Acertos jogo 2 (apenas se tiver resultado)
      if (resultado) {
        currentY += (Math.ceil(numerosJogo2.length / numsPerRow) * (numSize + numSpacing)) + 15;
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.roundRect(width/2 - 50, currentY, 100, 30, 15);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.font = '600 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${acertosJogo2} acerto${acertosJogo2 !== 1 ? 's' : ''}`, width/2, currentY + 20);
        
        currentY += 60;
      } else {
        currentY += (Math.ceil(numerosJogo2.length / numsPerRow) * (numSize + numSpacing)) + 40;
      }
      
      // Mensagem (se houver)
      if (mensagem) {
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(20, currentY, width - 40, 50);
        
        ctx.fillStyle = '#4b5563';
        ctx.font = 'italic 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        
        // Quebrar mensagem em linhas
        const maxWidth = width - 60;
        const words = mensagem.split(' ');
        let line = '';
        let lineY = currentY + 20;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(`"${line}"`, 30, lineY);
            line = words[n] + ' ';
            lineY += 20;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(`"${line.trim()}"`, 30, lineY);
        
        currentY += 70;
      }
      
      // Footer
      const footerY = Math.min(currentY + 20, height - 60);
      ctx.fillStyle = '#e5e7eb';
      ctx.fillRect(20, footerY, width - 40, 2);
      
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Compartilhado via ${bolao?.titulo}`, width / 2, footerY + 20);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('inov4dev.com.br', width / 2, footerY + 40);
      
      // Adicionar borda arredondada à imagem
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 16);
      ctx.stroke();
      
      // Converter para blob
      return new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            throw new Error('Falha ao criar imagem');
          }
        }, 'image/png', 1.0);
      });
      
    } catch (error) {
      console.error('Erro ao gerar imagem:', error);
      throw error;
    }
  };

  // Função para compartilhar via WhatsApp Web (fallback seguro)
  const compartilharViaWhatsAppWeb = (text: string, imageUrl?: string) => {
    try {
      let whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      
      if (imageUrl) {
        whatsappUrl += `%0A%0A${encodeURIComponent(imageUrl)}`;
      }
      
      // Usar window.location para evitar problemas com popups bloqueados
      const newWindow = window.open(whatsappUrl, '_blank');
      if (!newWindow) {
        // Se o popup for bloqueado, redirecionar na mesma janela
        window.location.href = whatsappUrl;
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      alert('Não foi possível abrir o WhatsApp. Tente manualmente.');
    }
  };

  // Função principal para compartilhar com tratamento de erros robusto
  const compartilharCardComoImagem = async () => {
    setIsSharing(true);
    
    try {
      // Gerar imagem usando Canvas
      const blob = await gerarImagemDoCard();
      
      // Criar arquivo
      const file = new File([blob], `aposta-${nomeApostador.replace(/\s+/g, '-')}.png`, { 
        type: 'image/png' 
      });

      // Criar URL temporária
      const imageUrl = URL.createObjectURL(file);

      // Texto para compartilhar
      let shareText = `🎯 ${resultado ? 'Minha aposta no' : 'Nova aposta no'} Bolão da Sorte!\n\n`;
      shareText += `👤 ${nomeApostador}\n`;
      
      if (posicao && resultado) {
        shareText += `🏅 ${posicao}º lugar\n`;
      }
      
      if (resultado) {
        shareText += `✅ ${totalAcertos} acertos\n`;
        shareText += `${ganhou ? '🏆 GANHADOR!' : ''}\n`;
      } else {
        shareText += `🎰 2 jogos registrados\n`;
      }
      
      shareText += `\n🔗 inov4dev.com.br`;

      // Tentar compartilhamento nativo (mobile) com timeout
      if (navigator.share) {
        try {
          // Adicionar timeout para evitar que o erro da extensão interrompa o processo
          const sharePromise = navigator.share({
            files: [file],
            text: shareText,
            title: resultado ? 'Minha Aposta - Bolão da Sorte' : 'Nova Aposta - Bolão da Sorte',
          });

          // Timeout de 5 segundos para o compartilhamento nativo
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Tempo limite excedido')), 5000);
          });

          await Promise.race([sharePromise, timeoutPromise]);
          
          setIsSuccess(true);
        } catch (shareError) {
          console.log('Native share failed, falling back to WhatsApp Web:', shareError);
          // Ignorar erros específicos de extensões
          if (!(shareError instanceof Error && shareError.message?.includes('port closed'))) {
            compartilharViaWhatsAppWeb(shareText, imageUrl);
            setIsSuccess(true);
          }
        }
      } else {
        // Fallback para WhatsApp Web
        compartilharViaWhatsAppWeb(shareText, imageUrl);
        setIsSuccess(true);
      }

      // Chamar callback se existir
      if (onShare) {
        onShare(imageUrl);
      }

      // Limpar URL após 10 segundos
      setTimeout(() => URL.revokeObjectURL(imageUrl), 10000);

      // Resetar estado de sucesso após 2 segundos
      setTimeout(() => setIsSuccess(false), 2000);

    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Feedback amigável para o usuário
      alert('Não foi possível compartilhar no momento. Você pode tentar novamente ou salvar a imagem manualmente.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <button
      onClick={compartilharCardComoImagem}
      disabled={isSharing}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isSharing ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Gerando imagem...
        </>
      ) : isSuccess ? (
        <>
          <div className="w-5 h-5 bg-green-300 rounded-full flex items-center justify-center">
            ✓
          </div>
          Compartilhado!
        </>
      ) : (
        <>
          <Share2 size={18} />
          Compartilhar Imagem
        </>
      )}
    </button>
  );
}