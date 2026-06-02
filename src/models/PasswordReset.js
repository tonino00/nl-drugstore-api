module.exports = (sequelize, DataTypes) => {
  const PasswordReset = sequelize.define(
    'PasswordReset',
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      token: { type: DataTypes.STRING, allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      used_at: { type: DataTypes.DATE },
    },
    {
      tableName: 'password_resets',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return PasswordReset;
};
