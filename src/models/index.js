const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User')(sequelize, Sequelize.DataTypes);
const Medicine = require('./Medicine')(sequelize, Sequelize.DataTypes);
const StockMovement = require('./StockMovement')(sequelize, Sequelize.DataTypes);
const PasswordReset = require('./PasswordReset')(sequelize, Sequelize.DataTypes);
const Favorite = require('./Favorite')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);
const PharmacyHours = require('./PharmacyHours')(sequelize, Sequelize.DataTypes);

User.hasMany(PasswordReset, { foreignKey: 'user_id' });
PasswordReset.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Favorite, { foreignKey: 'user_id' });
Favorite.belongsTo(User, { foreignKey: 'user_id' });

Medicine.hasMany(Favorite, { foreignKey: 'medicine_id' });
Favorite.belongsTo(Medicine, { foreignKey: 'medicine_id' });

User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });

Medicine.hasMany(StockMovement, { foreignKey: 'medicine_id' });
StockMovement.belongsTo(Medicine, { foreignKey: 'medicine_id' });

User.hasMany(StockMovement, { foreignKey: 'usuario_id' });
StockMovement.belongsTo(User, { foreignKey: 'usuario_id' });

module.exports = {
  sequelize,
  User,
  Medicine,
  StockMovement,
  PasswordReset,
  Favorite,
  Notification,
  PharmacyHours,
};
