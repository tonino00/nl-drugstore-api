module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      body: { type: DataTypes.TEXT, allowNull: false },
      type: { type: DataTypes.STRING, allowNull: false },
      data: { type: DataTypes.JSONB },
      read: { type: DataTypes.BOOLEAN, defaultValue: false },
      sent_at: { type: DataTypes.DATE },
    },
    {
      tableName: 'notifications',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Notification;
};
