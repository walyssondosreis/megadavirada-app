-- Tabela de Usuários
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('admin', 'usuario')),
  senha VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de Bolões
CREATE TABLE boloes (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(50) NOT NULL,
  subtitulo VARCHAR(100),
  qtd_cotas INTEGER DEFAULT 2 CHECK (qtd_cotas >= 1),
  loteria VARCHAR(100) NOT NULL,
  concurso INTEGER NOT NULL,
  esta_aberto BOOLEAN DEFAULT TRUE,
  status VARCHAR(100) DEFAULT 'aberto',
  valor_cota DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  resultado VARCHAR(50), -- Números sorteados separados por vírgula
  link_whatsapp VARCHAR(200),
  chave_pix VARCHAR(200) -- Chave PIX para pagamento
);

-- Tabela de Apostas
CREATE TABLE apostas (
  id SERIAL PRIMARY KEY,
  mensagem VARCHAR(100),
  jogo_1 VARCHAR(50) NOT NULL, -- 6 números separados por vírgula
  jogo_2 VARCHAR(50) NOT NULL, -- 6 números separados por vírgula
  nome_apostador VARCHAR(100) NOT NULL,
  aposta_paga BOOLEAN DEFAULT FALSE,
  aposta_registrada BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'registrado')),
  bolao_id INTEGER REFERENCES boloes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Inserir usuário admin padrão (senha: admin123)
INSERT INTO usuarios (username, tipo, senha) 
VALUES ('admin', 'admin', 'admin123');

-- Inserir bolão exemplo
INSERT INTO boloes (titulo, subtitulo, loteria, concurso, valor_cota, link_whatsapp) 
VALUES (
  'Bolão TESTE 2999', 
  'Este é o banco teste os dados fakes',
  'Mega-Sena',
  0001,
  12.00,
  'https://chat.whatsapp.com/seu-link-aqui'
);

-- Índices para performance
CREATE INDEX idx_apostas_bolao ON apostas(bolao_id);
CREATE INDEX idx_apostas_status ON apostas(status);
CREATE INDEX idx_boloes_concurso ON boloes(concurso);

-- Habilitar Row Level Security (RLS)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE boloes ENABLE ROW LEVEL SECURITY;
ALTER TABLE apostas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (permitir leitura pública, escrita autenticada)
CREATE POLICY "Permitir leitura pública de bolões" ON boloes FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de apostas" ON apostas FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de apostas" ON apostas FOR INSERT WITH CHECK (true);

-- Políticas para admin (acesso total)
CREATE POLICY "Admin acesso total bolões" ON boloes FOR ALL USING (true);
CREATE POLICY "Admin acesso total apostas" ON apostas FOR ALL USING (true);
CREATE POLICY "Admin acesso total usuários" ON usuarios FOR ALL USING (true);

