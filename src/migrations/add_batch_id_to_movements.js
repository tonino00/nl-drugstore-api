module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('stock_movements', 'batch_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'batches', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('stock_movements', 'batch_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addIndex('stock_movements', ['batch_id']);
    await queryInterface.addIndex('stock_movements', ['batch_number']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('stock_movements', ['batch_number']).catch(() => null);
    await queryInterface.removeIndex('stock_movements', ['batch_id']).catch(() => null);
    await queryInterface.removeColumn('stock_movements', 'batch_number');
    await queryInterface.removeColumn('stock_movements', 'batch_id');
  },
};
