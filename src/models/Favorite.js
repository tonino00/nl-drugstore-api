module.exports = (sequelize, DataTypes) => {
  const Favorite = sequelize.define(
    'Favorite',
    {
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      medicine_id: { type: DataTypes.INTEGER, allowNull: false },
      notify_on_restock: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    {
      tableName: 'favorites',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      indexes: [{ unique: true, fields: ['user_id', 'medicine_id'] }],
    }
  );

  return Favorite;
};
