module.exports = (sequelize, DataTypes) => {
  const Medicine = sequelize.define(
    'Medicine',
    {
      nome: { type: DataTypes.STRING, allowNull: false },
      principio_ativo: { type: DataTypes.STRING, allowNull: false },
      concentracao: { type: DataTypes.STRING },
      forma: { type: DataTypes.STRING },
      quantidade: { type: DataTypes.INTEGER, defaultValue: 0 },
      quantidade_minima: { type: DataTypes.INTEGER, defaultValue: 5 },
      validade: { type: DataTypes.DATEONLY, allowNull: false },
      categoria: { type: DataTypes.STRING },
      localizacao: { type: DataTypes.STRING },
      fabricante: { type: DataTypes.STRING },
      descricao: { type: DataTypes.TEXT },
      contraindicacoes: { type: DataTypes.TEXT },
      precisa_receita: { type: DataTypes.BOOLEAN, defaultValue: false },
      codigo_barras: { type: DataTypes.STRING(100), allowNull: true, unique: true },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'medicines',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return Medicine;
};
