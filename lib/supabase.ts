import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript
export interface Usuario {
  id: number;
  username: string;
  tipo: 'admin' | 'usuario';
  senha: string;
  created_at: string;
}

export interface Bolao {
  id: number;
  titulo: string;
  subtitulo: string;
  qtd_cotas: number;
  loteria: string;
  concurso: number;
  esta_aberto: boolean;
  status: string;
  valor_cota: number;
  criado_em: string;
  atualizado_em: string;
  resultado: string | null;
  link_whatsapp: string;
}

export interface Aposta {
  id: number;
  mensagem: string | null;
  jogo_1: string;
  jogo_2: string;
  nome_apostador: string;
  aposta_paga: boolean;
  aposta_registrada: boolean;
  status: 'pendente' | 'pago' | 'registrado';
  bolao_id: number;
  created_at: string;
}