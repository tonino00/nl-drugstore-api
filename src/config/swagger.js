const swaggerJSDoc = require('swagger-jsdoc');

const definition = {
  openapi: '3.0.0',
  info: {
    title: 'NL Drugstore API',
    version: '1.0.0',
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      AuthToken: {
        type: 'object',
        properties: { token: { type: 'string' } },
      },
      ErrorResponse: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      BatchCreateRequest: {
        type: 'object',
        required: ['batchNumber', 'quantity', 'expiryDate'],
        properties: {
          batchNumber: { type: 'string', example: 'L2026-0001' },
          quantity: { type: 'integer', minimum: 0, example: 100 },
          manufacturingDate: { type: 'string', format: 'date', example: '2026-01-10' },
          expiryDate: { type: 'string', format: 'date', example: '2027-01-10' },
          notes: { type: 'string' },
        },
      },
      StockMovementEntradaRequest: {
        type: 'object',
        required: ['medicineId', 'type', 'batchNumber', 'quantity', 'expiryDate'],
        properties: {
          medicineId: { type: 'integer', example: 1 },
          type: { type: 'string', enum: ['entrada'], example: 'entrada' },
          batchNumber: { type: 'string', example: 'L2026-0001' },
          quantity: { type: 'integer', minimum: 1, example: 50 },
          expiryDate: { type: 'string', format: 'date', example: '2027-01-10' },
          manufacturingDate: { type: 'string', format: 'date', example: '2026-01-10' },
          motivo: { type: 'string', example: 'compra' },
          observacao: { type: 'string', example: 'NF 12345' },
        },
      },
      StockMovementSaidaRequest: {
        type: 'object',
        required: ['medicineId', 'type', 'quantity'],
        properties: {
          medicineId: { type: 'integer', example: 1 },
          type: { type: 'string', enum: ['saida'], example: 'saida' },
          quantity: { type: 'integer', minimum: 1, example: 3 },
          motivo: { type: 'string', example: 'dispensacao' },
          pacienteId: { type: 'string', example: 'PAC-001' },
          observacao: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar usuário',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nome', 'email', 'senha'],
                properties: {
                  nome: { type: 'string' },
                  email: { type: 'string' },
                  senha: { type: 'string' },
                  telefone: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Criado', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthToken' } } } },
          409: { description: 'Conflito', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'senha'],
                properties: {
                  email: { type: 'string' },
                  senha: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthToken' } } } },
          401: { description: 'Não autorizado', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Dados do usuário logado',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/medicines': {
      get: {
        tags: ['Medicines'],
        summary: 'Listar medicamentos (público)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Medicines'],
        summary: 'Cadastrar medicamento (farmacêutico)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 201: { description: 'Criado' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/api/medicines/search': {
      get: {
        tags: ['Medicines'],
        summary: 'Busca avançada (público)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'categoria', in: 'query', schema: { type: 'string' } },
        ],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/medicines/categories': {
      get: {
        tags: ['Medicines'],
        summary: 'Listar categorias (público)',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/medicines/{id}': {
      get: {
        tags: ['Medicines'],
        summary: 'Detalhes do medicamento (público)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Não encontrado' } },
      },
      put: {
        tags: ['Medicines'],
        summary: 'Editar medicamento (farmacêutico)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object' } } } },
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
      delete: {
        tags: ['Medicines'],
        summary: 'Soft delete (farmacêutico)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/api/medicines/{id}/stock': {
      patch: {
        tags: ['Medicines'],
        summary: 'Atualizar estoque (farmacêutico)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['delta'],
                properties: {
                  delta: { type: 'integer' },
                  motivo: { type: 'string' },
                  observacao: { type: 'string' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/api/favorites': {
      get: {
        tags: ['Favorites'],
        summary: 'Listar favoritos',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/favorites/{medicineId}': {
      post: {
        tags: ['Favorites'],
        summary: 'Adicionar favorito',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'medicineId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 201: { description: 'Criado' }, 401: { description: 'Não autorizado' } },
      },
      delete: {
        tags: ['Favorites'],
        summary: 'Remover favorito',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'medicineId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/favorites/{medicineId}/notify': {
      post: {
        tags: ['Favorites'],
        summary: 'Ativar notificação de restoque',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'medicineId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/notifications/stream': {
      get: {
        tags: ['Notifications'],
        summary: 'Stream SSE (token via query param ou header)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'token', in: 'query', required: false, schema: { type: 'string' } }],
        responses: { 200: { description: 'SSE stream' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/notifications': {
      get: {
        tags: ['Notifications'],
        summary: 'Listar notificações (histórico)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer' } },
        ],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/notifications/unread-count': {
      get: {
        tags: ['Notifications'],
        summary: 'Contagem de não lidas',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar todas como lidas',
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' } },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Marcar como lida',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 404: { description: 'Não encontrado' } },
      },
    },
    '/api/notifications/{id}': {
      delete: {
        tags: ['Notifications'],
        summary: 'Deletar notificação',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 404: { description: 'Não encontrado' } },
      },
    },
    '/api/pharmacy-hours': {
      get: {
        tags: ['PharmacyHours'],
        summary: 'Listar horário',
        responses: { 200: { description: 'OK' } },
      },
      put: {
        tags: ['PharmacyHours'],
        summary: 'Configurar horário (admin)',
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'array', items: { type: 'object' } } } } },
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/api/pharmacy-hours/status': {
      get: {
        tags: ['PharmacyHours'],
        summary: 'Aberto/fechado',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/pharmacy-hours/next-opening': {
      get: {
        tags: ['PharmacyHours'],
        summary: 'Próxima abertura',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/medicines/{medicineId}/batches': {
      get: {
        tags: ['Batches'],
        summary: 'Listar lotes por medicamento',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'medicineId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['active', 'expired', 'all'], default: 'active' } },
        ],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' }, 404: { description: 'Medicamento não encontrado' } },
      },
      post: {
        tags: ['Batches'],
        summary: 'Cadastrar novo lote para um medicamento',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'medicineId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/BatchCreateRequest' } } },
        },
        responses: { 200: { description: 'OK' }, 400: { description: 'Dados inválidos' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/api/batches/{batchId}/expire': {
      post: {
        tags: ['Batches'],
        summary: 'Marcar lote como inativo e registrar baixa',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'batchId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' }, 404: { description: 'Não encontrado' } },
      },
    },
    '/api/batches/expiring': {
      get: {
        tags: ['Batches'],
        summary: 'Listar lotes com validade próxima',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'days', in: 'query', required: false, schema: { type: 'integer', default: 30 } }],
        responses: { 200: { description: 'OK' }, 401: { description: 'Não autorizado' }, 403: { description: 'Sem permissão' } },
      },
    },
    '/api/batches/trace': {
      get: {
        tags: ['Batches'],
        summary: 'Rastrear informações públicas de um lote',
        parameters: [{ name: 'batchNumber', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Não encontrado' } },
      },
    },
    '/api/stock/movements': {
      post: {
        tags: ['Stock'],
        summary: 'Registrar movimentação de estoque (entrada/saída via PEPS)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/StockMovementEntradaRequest' },
                  { $ref: '#/components/schemas/StockMovementSaidaRequest' },
                ],
              },
            },
          },
        },
        responses: {
          200: { description: 'OK' },
          400: { description: 'Dados inválidos' },
          401: { description: 'Não autorizado' },
          403: { description: 'Sem permissão' },
          409: { description: 'Estoque insuficiente' },
        },
      },
    },
  },
};

const options = {
  definition,
  apis: [],
};

module.exports = swaggerJSDoc(options);
