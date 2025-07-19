const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const TaskAssignee = sequelize.define('TaskAssignee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Tasks',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  }, {
    indexes: [
      {
        fields: ['taskId'],
      },
      {
        fields: ['userId'],
      },
      {
        unique: true,
        fields: ['taskId', 'userId'],
      },
    ],
    timestamps: false,
  });

  return TaskAssignee;
}; 