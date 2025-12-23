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
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    loadBolao();
    
    // Carregar a imagem do logo
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = 'https://static.vecteezy.com/system/resources/previews/019/880/710/non_2x/four-leaf-clover-png.png';
    img.onload = () => {
      setLogoImage(img);
    };
    img.onerror = () => {
      console.warn('Não foi possível carregar o logo, continuando sem ele.');
    };
      
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

  // Função para calcular altura total necessária
  const calcularAlturaNecessaria = () => {
    // Altura base fixa
    let altura = 70; // Header
    
    // Altura dos elementos dinâmicos
    altura += 25; // Espaço após header
    altura += 30; // Badge do concurso
    altura += 20; // Espaço após badge
    
    // Posição no ranking (se houver)
    if (posicao && !estaAberto) {
      altura += 35; // Badge de posição
      altura += 20; // Espaço após posição
    }
    
    // Nome do apostador e status
    altura += 40; // Nome + "Nova aposta registrada" ou acertos
    altura += 10; // Espaço
    
    // Status GANHOU/PERDEU (apenas se tiver resultado)
    if (resultado) {
      altura += 50; // Status + espaços
    }
    
    // Jogos (considerando 2 linhas de 6 números cada)
    const numerosJogo1 = jogo1.split(',').map(Number);
    const numerosJogo2 = jogo2.split(',').map(Number);
    const numSize = 32;
    const numSpacing = 6;
    const numsPerRow = 6;
    
    // Altura do Jogo 1
    altura += 20; // Título "Jogo 1:"
    altura += Math.ceil(numerosJogo1.length / numsPerRow) * (numSize + numSpacing);
    
    if (resultado) {
      altura += 12; // Espaço após números
      altura += 25; // Badge de acertos
      altura += 15; // Espaço após badge
    } else {
      altura += 25; // Espaço após números (sem resultado)
    }
    
    // Altura do Jogo 2
    altura += 20; // Título "Jogo 2:"
    altura += Math.ceil(numerosJogo2.length / numsPerRow) * (numSize + numSpacing);
    
    if (resultado) {
      altura += 12; // Espaço após números
      altura += 25; // Badge de acertos
      altura += 15; // Espaço após badge
    } else {
      altura += 25; // Espaço após números (sem resultado)
    }
    
    // Mensagem (se houver)
    if (mensagem) {
      altura += 10; // Espaço antes da mensagem
      altura += 40; // Container da mensagem
      altura += 20; // Espaço após mensagem
    }
    
    // Footer
    altura += 15; // Espaço antes do footer
    altura += 45; // Footer
    
    // Margem de segurança e borda
    altura += 30;
    
    return Math.max(altura, 500); // Altura mínima de 500px
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
      
      // Configurar dimensões otimizadas
      const width = 375;
      
      // Calcular altura dinamicamente considerando TODOS os elementos
      const height = calcularAlturaNecessaria();
      canvas.width = width * 2;
      canvas.height = height * 2;
      ctx.scale(2, 2);
      
      // Fundo branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      
      // HEADER ESTILIZADO - BRANCO COM TEXTO PRETO
      const headerHeight = 70; // Altura do header
      
      // Header branco
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, headerHeight);
      
      // Logo à esquerda
      const logoSize = 40;
      const logoLeft = 20;
      const logoTop = (headerHeight - logoSize) / 2;
      
      if (logoImage) {
        try {
          // Desenhar o logo
          ctx.drawImage(logoImage, logoLeft, logoTop, logoSize, logoSize);
        } catch (error) {
          console.warn('Erro ao desenhar o logo:', error);
        }
      }
      
      // Textos do header - alinhados à direita do logo
      const textStartX = logoLeft + logoSize + 15;
      
      // Título principal - texto preto
      ctx.fillStyle = '#1f2937'; // Cinza escuro (quase preto)
      ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      
      // Truncar título se necessário
      let titulo = bolao?.titulo || 'Bolão';
      const maxTitleWidth = width - textStartX - 20;
      
      if (ctx.measureText(titulo).width > maxTitleWidth) {
        while (ctx.measureText(titulo + '...').width > maxTitleWidth && titulo.length > 15) {
          titulo = titulo.slice(0, -1);
        }
        titulo += '...';
      }
      
      // Posicionar título
      const titleY = headerHeight / 2 - 12;
      ctx.fillText(titulo, textStartX, titleY);
      
      // Subtítulo - usando a propriedade bolao?.subtitulo - texto cinza
      const subtitulo = bolao?.subtitulo || 'Bolão da Sorte';
      ctx.fillStyle = '#6b7280'; // Cinza médio
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      
      // Truncar subtítulo se necessário
      let subtituloDisplay = subtitulo;
      if (ctx.measureText(subtituloDisplay).width > maxTitleWidth) {
        while (ctx.measureText(subtituloDisplay + '...').width > maxTitleWidth && subtituloDisplay.length > 25) {
          subtituloDisplay = subtituloDisplay.slice(0, -1);
        }
        subtituloDisplay += '...';
      }
      
      // Posicionar subtítulo
      const subtitleY = headerHeight / 2 + 12;
      ctx.fillText(subtituloDisplay, textStartX, subtitleY);
      
      // LINHA VERDE SEPARADORA - abaixo do header
      ctx.strokeStyle = '#10b981'; // Verde
      ctx.lineWidth = 3; // Linha mais grossa para destaque
      ctx.beginPath();
      ctx.moveTo(20, headerHeight); // Começa um pouco afastada da borda
      ctx.lineTo(width - 20, headerHeight); // Termina um pouco afastada da borda
      ctx.stroke();
      
      // Sombra sutil abaixo da linha para profundidade
      ctx.shadowColor = 'rgba(16, 185, 129, 0.2)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, headerHeight + 1);
      ctx.lineTo(width - 20, headerHeight + 1);
      ctx.stroke();
      ctx.shadowColor = 'transparent'; // Reset shadow
      
      // ÁREA DE CONTEÚDO
      let currentY = headerHeight + 25; // Começa após o header com espaçamento
      
      // BADGE DO CONCURSO - estilo moderno
      const badgeWidth = 120;
      const badgeHeight = 30;
      const badgeX = (width - badgeWidth) / 2;
      
      // Fundo do badge - verde claro
      ctx.fillStyle = '#d1fae5'; // Verde muito claro
      ctx.beginPath();
      ctx.roundRect(badgeX, currentY, badgeWidth, badgeHeight, 15);
      ctx.fill();
      
      // Borda do badge - verde
      ctx.strokeStyle = '#10b981'; // Verde
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(badgeX, currentY, badgeWidth, badgeHeight, 15);
      ctx.stroke();
      
      // Texto do badge - verde escuro
      ctx.fillStyle = '#065f46'; // Verde escuro
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`CONCURSO ${concurso}`, width / 2, currentY + badgeHeight / 2);
      
      currentY += badgeHeight + 20;
      
      // Posição no ranking (se houver) - estilo badge também
      if (posicao && !estaAberto) {
        const positionColors = {
          1: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
          2: { bg: '#ffedd5', border: '#ea580c', text: '#9a3412' },
          default: { bg: '#f3f4f6', border: '#6b7280', text: '#374151' }
        };
        
        const colors = positionColors[posicao as 1 | 2] || positionColors.default;
        
        ctx.fillStyle = colors.bg;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 60, currentY, 120, 35, 17);
        ctx.fill();
        
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(width / 2 - 60, currentY, 120, 35, 17);
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${posicao}º LUGAR`, width / 2, currentY + 19);
        
        currentY += 50;
      }
      
      // Nome do apostador
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      
      // Truncar nome se for muito longo
      let nomeDisplay = nomeApostador;
      if (ctx.measureText(nomeDisplay).width > width - 40) {
        while (ctx.measureText(nomeDisplay + '...').width > width - 40 && nomeDisplay.length > 12) {
          nomeDisplay = nomeDisplay.slice(0, -1);
        }
        nomeDisplay += '...';
      }
      
      ctx.fillText(nomeDisplay, 20, currentY);
      
      // Texto abaixo do nome
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
      
      if (resultado) {
        ctx.fillText(`${totalAcertos} acerto${totalAcertos !== 1 ? 's' : ''} no melhor jogo`, 20, currentY + 25);
        currentY += 40;
      } else {
        ctx.fillText('Nova Aposta Registrada', 20, currentY + 25); 
        currentY += 40;
      }
      
      // Status (apenas se tiver resultado)
      if (resultado) {
        const statusWidth = 140;
        const statusHeight = 35;
        const statusX = 20;
        
        ctx.fillStyle = ganhou ? '#10b981' : '#9ca3af';
        ctx.beginPath();
        ctx.roundRect(statusX, currentY, statusWidth, statusHeight, 10);
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ganhou ? '🏆 GANHOU' : '😞 PERDEU', statusX + statusWidth/2, currentY + statusHeight/2);
        
        currentY += 50;
      }
      
      // Calcular espaço entre números
      const numSize = 32;
      const numSpacing = 6;
      const numsPerRow = 6;
      const rowWidth = (numsPerRow * numSize) + ((numsPerRow - 1) * numSpacing);
      const startX = (width - rowWidth) / 2;
      
      // Jogo 1
      ctx.fillStyle = '#4b5563';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      
      if (resultado) {
        ctx.fillText(`Jogo 1 (${acertosJogo1} acertos):`, 20, currentY);
      } else {
        ctx.fillText('Jogo 1:', 20, currentY);
      }
      
      currentY += 20;
      
      const numerosJogo1 = jogo1.split(',').map(Number);
      
      for (let i = 0; i < numerosJogo1.length; i++) {
        const row = Math.floor(i / numsPerRow);
        const col = i % numsPerRow;
        const x = startX + col * (numSize + numSpacing);
        const y = currentY + row * (numSize + numSpacing);
        
        // Se NÃO tiver resultado, todas as bolas são cinza
        const acertou = resultado ? resultadoNumeros.includes(numerosJogo1[i]) : false;
        ctx.fillStyle = resultado ? (acertou ? '#10b981' : '#d1d5db') : '#d1d5db';
        ctx.beginPath();
        ctx.arc(x + numSize/2, y + numSize/2, numSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        if (resultado && acertou) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
        }
        
        // Número bem posicionado
        ctx.fillStyle = resultado ? (acertou ? '#ffffff' : '#4b5563') : '#4b5563';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numerosJogo1[i].toString().padStart(2, '0'), x + numSize/2, y + numSize/2);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Acertos jogo 1 (apenas se tiver resultado)
      if (resultado) {
        currentY += (Math.ceil(numerosJogo1.length / numsPerRow) * (numSize + numSpacing)) + 12;
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.roundRect(width/2 - 40, currentY, 80, 25, 12);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${acertosJogo1} acerto${acertosJogo1 !== 1 ? 's' : ''}`, width/2, currentY + 13);
        
        currentY += 40;
      } else {
        currentY += (Math.ceil(numerosJogo1.length / numsPerRow) * (numSize + numSpacing)) + 25;
      }
      
      // Jogo 2
      ctx.fillStyle = '#4b5563';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      
      if (resultado) {
        ctx.fillText(`Jogo 2 (${acertosJogo2} acertos):`, 20, currentY);
      } else {
        ctx.fillText('Jogo 2:', 20, currentY);
      }
      
      currentY += 20;
      
      const numerosJogo2 = jogo2.split(',').map(Number);
      
      for (let i = 0; i < numerosJogo2.length; i++) {
        const row = Math.floor(i / numsPerRow);
        const col = i % numsPerRow;
        const x = startX + col * (numSize + numSpacing);
        const y = currentY + row * (numSize + numSpacing);
        
        // Se NÃO tiver resultado, todas as bolas são cinza
        const acertou = resultado ? resultadoNumeros.includes(numerosJogo2[i]) : false;
        ctx.fillStyle = resultado ? (acertou ? '#10b981' : '#d1d5db') : '#d1d5db';
        ctx.beginPath();
        ctx.arc(x + numSize/2, y + numSize/2, numSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        if (resultado && acertou) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
          ctx.shadowBlur = 2;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 2;
        }
        
        // Número bem posicionado
        ctx.fillStyle = resultado ? (acertou ? '#ffffff' : '#4b5563') : '#4b5563';
        ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(numerosJogo2[i].toString().padStart(2, '0'), x + numSize/2, y + numSize/2);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      // Acertos jogo 2 (apenas se tiver resultado)
      if (resultado) {
        currentY += (Math.ceil(numerosJogo2.length / numsPerRow) * (numSize + numSpacing)) + 12;
        ctx.fillStyle = '#f3f4f6';
        ctx.beginPath();
        ctx.roundRect(width/2 - 40, currentY, 80, 25, 12);
        ctx.fill();
        
        ctx.fillStyle = '#374151';
        ctx.font = '600 11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${acertosJogo2} acerto${acertosJogo2 !== 1 ? 's' : ''}`, width/2, currentY + 13);
        
        currentY += 40;
      } else {
        currentY += (Math.ceil(numerosJogo2.length / numsPerRow) * (numSize + numSpacing)) + 25;
      }
      
      // Mensagem (se houver) - estilo moderno
      if (mensagem) {
        const maxMsgHeight = 40;
        const msgContainerTop = currentY + 10;
        
        // Fundo da mensagem
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(20, msgContainerTop, width - 40, maxMsgHeight, 10);
        ctx.fill();
        
        // Borda sutil
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(20, msgContainerTop, width - 40, maxMsgHeight, 10);
        ctx.stroke();
        
        ctx.fillStyle = '#4b5563';
        ctx.font = 'italic 11px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Limitar mensagem a 2 linhas máximo
        const maxWidth = width - 50;
        const words = mensagem.split(' ');
        let line1 = '';
        let line2 = '';
        let currentLine = '';
        
        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + (currentLine ? ' ' : '') + words[n];
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > maxWidth) {
            if (!line1) {
              line1 = currentLine;
              currentLine = words[n];
            } else if (!line2) {
              line2 = currentLine + '...';
              break;
            }
          } else {
            currentLine = testLine;
          }
        }
        
        if (!line1) line1 = currentLine;
        if (!line2 && currentLine !== line1) line2 = currentLine;
        
        // Garantir que não exceda 2 linhas
        if (line2 && line2.length > 30) {
          line2 = line2.substring(0, 27) + '...';
        }
        
        // Desenhar as linhas centralizadas verticalmente
        const totalLines = line2 ? 2 : 1;
        const lineHeight = 12;
        const totalTextHeight = totalLines * lineHeight;
        const textStartY = msgContainerTop + (maxMsgHeight - totalTextHeight) / 2 + lineHeight/2;
        
        ctx.fillText(`"${line1}"`, 25, textStartY);
        if (line2) {
          ctx.fillText(line2, 25, textStartY + lineHeight);
        }
        
        currentY += maxMsgHeight + 20;
      }
      
      // Footer - sempre com espaço suficiente
      const footerY = currentY + 15;
      
      // Verificar se há espaço suficiente para o footer
      const espaçoRestante = height - footerY;
      const alturaFooterNecessaria = 50;
      
      if (espaçoRestante < alturaFooterNecessaria) {
        // Ajustar footer para cima se necessário
        currentY = height - alturaFooterNecessaria - 20;
      }
      
      // Linha divisória do footer
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, currentY + 10);
      ctx.lineTo(width - 20, currentY + 10);
      ctx.stroke();
      
      // Textos do footer
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`Compartilhado via ${titulo}`, width / 2, currentY + 28);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('inov4dev.com.br', width / 2, currentY + 45);
      
      // Borda arredondada final da imagem
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(0, 0, width, height, 12);
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

      // Tentar compartilhamento nativo (mobile) com timeout
      if (navigator.share) {
        try {
          // Adicionar timeout para evitar que o erro da extensão interrompa o processo
          const sharePromise = navigator.share({
            files: [file],
            title: resultado ? 'Minha Aposta - Bolão da Sorte' : 'Nova Aposta - Bolão da Sorte',
          });

          // Timeout de 5 segundos para o compartilhamento nativo
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Tempo limite excedido')), 5000);
          });

          await Promise.race([sharePromise, timeoutPromise]);
          
          setIsSuccess(true);
        } catch (shareError) {
          console.log('Native share failed:', shareError);
          // Simplesmente mostramos que a imagem foi gerada
          setIsSuccess(true);
        }
      } else {
        // Fallback: apenas gerar a imagem e mostrar sucesso
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
      console.error('Erro ao gerar imagem:', error);
      alert('Não foi possível gerar a imagem. Tente novamente.');
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
          Compartilhar
        </>
      )}
    </button>
  );
}