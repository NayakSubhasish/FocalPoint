const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const Project = sequelize.define('Project', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
    },
    endDate: {
      type: DataTypes.DATE,
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled'),
      defaultValue: 'planning',
    },
    billingMethod: {
      type: DataTypes.ENUM('hourly', 'fixed', 'per_transaction'),
      defaultValue: 'hourly',
    },
    estimatedHours: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    estimatedTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    managerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    teamLeaderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  }, {
    indexes: [
      {
        fields: ['managerId'],
      },
      {
        fields: ['teamLeaderId'],
      },
    ],
  });

  // Define associations
  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: 'managerId',
      as: 'manager',
    });
    
    Project.belongsTo(models.User, {
      foreignKey: 'teamLeaderId',
      as: 'teamLeader',
    });
    
    Project.belongsToMany(models.User, {
      through: 'ProjectTeam',
      foreignKey: 'projectId',
      otherKey: 'userId',
      as: 'teamMembers',
    });
    
    Project.hasMany(models.Task, {
      foreignKey: 'projectId',
      as: 'tasks',
    });
  };

  return Project;
}; 