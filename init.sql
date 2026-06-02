-- Users
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'user',
  notification_enabled BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  last_login TIMESTAMP,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicines
CREATE TABLE IF NOT EXISTS medicines (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  principio_ativo VARCHAR(255) NOT NULL,
  concentracao VARCHAR(100),
  forma VARCHAR(100),
  quantidade INTEGER DEFAULT 0 CHECK (quantidade >= 0),
  quantidade_minima INTEGER DEFAULT 5,
  validade DATE NOT NULL,
  categoria VARCHAR(100),
  localizacao VARCHAR(100),
  fabricante VARCHAR(255),
  descricao TEXT,
  contraindicacoes TEXT,
  precisa_receita BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  medicine_id INTEGER REFERENCES medicines(id),
  tipo VARCHAR(20) CHECK (tipo IN ('entrada', 'saida')),
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  motivo VARCHAR(255),
  observacao TEXT,
  usuario_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Favorites
CREATE TABLE IF NOT EXISTS favorites (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
  notify_on_restock BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, medicine_id)
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password Resets
CREATE TABLE IF NOT EXISTS password_resets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pharmacy Hours
CREATE TABLE IF NOT EXISTS pharmacy_hours (
  id SERIAL PRIMARY KEY,
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  opening_time TIME,
  closing_time TIME,
  is_open BOOLEAN DEFAULT TRUE,
  lunch_start TIME,
  lunch_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
