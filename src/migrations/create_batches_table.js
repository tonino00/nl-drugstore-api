module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create batches table
    await queryInterface.createTable('batches', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      medicine_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'medicines', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      batch_number: { type: Sequelize.STRING(100), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      manufacturing_date: { type: Sequelize.DATEONLY },
      expiry_date: { type: Sequelize.DATEONLY, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      notes: { type: Sequelize.TEXT },
      created_by: { type: Sequelize.INTEGER, references: { model: 'users', key: 'id' } },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
    });

    await queryInterface.addIndex('batches', ['medicine_id', 'batch_number'], { unique: true, name: 'batches_medicine_batch_unique' });
    await queryInterface.addIndex('batches', ['medicine_id']);
    await queryInterface.addIndex('batches', ['expiry_date']);

    // Enforce non-negative quantity for Postgres
    await queryInterface.sequelize.query(
      "ALTER TABLE batches ADD CONSTRAINT batches_quantity_nonnegative CHECK (quantity >= 0)"
    );

    // Create expiry_alerts table
    await queryInterface.createTable('expiry_alerts', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      batch_id: { type: Sequelize.INTEGER, references: { model: 'batches', key: 'id' } },
      alert_type: { type: Sequelize.STRING(50), allowNull: false },
      sent_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
      resolved: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
    });

    await queryInterface.addIndex('expiry_alerts', ['batch_id']);
    await queryInterface.addIndex('expiry_alerts', ['alert_type']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('expiry_alerts');
    await queryInterface.dropTable('batches');
  },
};
