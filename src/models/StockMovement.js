module.exports = (sequelize, DataTypes) => {
  const StockMovement = sequelize.define(
    'StockMovement',
    {
      medicine_id: { type: DataTypes.INTEGER, allowNull: false },
      tipo: { type: DataTypes.STRING, allowNull: false },
      quantidade: { type: DataTypes.INTEGER, allowNull: false },
      motivo: { type: DataTypes.STRING },
      observacao: { type: DataTypes.TEXT },
      usuario_id: { type: DataTypes.INTEGER },
      batch_id: { type: DataTypes.INTEGER },
      batch_number: { type: DataTypes.STRING(100) },
    },
    {
      tableName: 'stock_movements',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return StockMovement;
};
