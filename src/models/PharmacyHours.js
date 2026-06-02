module.exports = (sequelize, DataTypes) => {
  const PharmacyHours = sequelize.define(
    'PharmacyHours',
    {
      day_of_week: { type: DataTypes.INTEGER, allowNull: false },
      opening_time: { type: DataTypes.TIME },
      closing_time: { type: DataTypes.TIME },
      is_open: { type: DataTypes.BOOLEAN, defaultValue: true },
      lunch_start: { type: DataTypes.TIME },
      lunch_end: { type: DataTypes.TIME },
    },
    {
      tableName: 'pharmacy_hours',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  return PharmacyHours;
};
