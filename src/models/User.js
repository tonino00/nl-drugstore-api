module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      nome: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      senha: { type: DataTypes.STRING, allowNull: false },
      telefone: { type: DataTypes.STRING },
      role: { type: DataTypes.STRING, defaultValue: 'user' },
      notification_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
      avatar_url: { type: DataTypes.TEXT },
      last_login: { type: DataTypes.DATE },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return User;
};
