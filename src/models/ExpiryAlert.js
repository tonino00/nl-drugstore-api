module.exports = (sequelize, DataTypes) => {
  const ExpiryAlert = sequelize.define(
    'ExpiryAlert',
    {
      batch_id: { type: DataTypes.INTEGER, allowNull: false },
      alert_type: { type: DataTypes.STRING(50), allowNull: false },
      sent_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      resolved: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      tableName: 'expiry_alerts',
      underscored: true,
      timestamps: false,
      indexes: [
        { fields: ['batch_id'] },
        { fields: ['alert_type'] },
      ],
    }
  );

  return ExpiryAlert;
};
