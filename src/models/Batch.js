module.exports = (sequelize, DataTypes) => {
  const Batch = sequelize.define(
    'Batch',
    {
      medicine_id: { type: DataTypes.INTEGER, allowNull: false },
      batch_number: { type: DataTypes.STRING(100), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      manufacturing_date: { type: DataTypes.DATEONLY, allowNull: true },
      expiry_date: { type: DataTypes.DATEONLY, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      notes: { type: DataTypes.TEXT },
      created_by: { type: DataTypes.INTEGER },
    },
    {
      tableName: 'batches',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['medicine_id', 'batch_number'] },
        { fields: ['medicine_id'] },
        { fields: ['expiry_date'] },
      ],
    }
  );

  return Batch;
};
