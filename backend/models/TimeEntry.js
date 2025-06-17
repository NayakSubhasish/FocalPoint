const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const TimeEntry = sequelize.define('TimeEntry', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    hours: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    transactions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    transactionType: {
      type: DataTypes.ENUM('pages', 'images', 'records'),
      allowNull: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  TimeEntry.associate = (models) => {
    TimeEntry.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    TimeEntry.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
  };

  return TimeEntry;
}; 