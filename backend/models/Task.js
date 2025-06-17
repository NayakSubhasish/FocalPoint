const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Task = sequelize.define('Task', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
        key: 'id',
      },
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'review', 'completed'),
      defaultValue: 'todo',
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
    },
    estimatedTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    transactionType: {
      type: DataTypes.ENUM('pages', 'images', 'records'),
      allowNull: true,
    },
    estimatedHours: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    deadline: {
      type: DataTypes.DATE,
    },
  }, {
    indexes: [
      {
        fields: ['projectId'],
      },
      {
        fields: ['assignedTo'],
      },
    ],
  });

  // Define associations
  Task.associate = (models) => {
    Task.belongsTo(models.Project, {
      foreignKey: 'projectId',
    });
    
    Task.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignee',
    });
  };

  return Task;
}; 