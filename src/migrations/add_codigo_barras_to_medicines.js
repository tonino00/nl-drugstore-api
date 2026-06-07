module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('medicines', 'codigo_barras', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('medicines', 'codigo_barras');
  },
};
