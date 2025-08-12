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
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [['pages', 'images', 'records']]
      }
    },
    estimatedHours: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    deadline: {
      type: DataTypes.DATE,
    },
    ownerId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
  }, {
    indexes: [
      {
        fields: ['projectId'],
      },
      {
        fields: ['assignedTo'],
      },
      {
        fields: ['ownerId'],
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

    Task.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner',
    });

    Task.belongsToMany(models.User, {
      through: models.TaskAssignee,
      foreignKey: 'taskId',
      otherKey: 'userId',
      as: 'assignees',
    });

    // Ensure the reverse association exists
    if (models.User && !models.User.associations?.tasksAssigned) {
      models.User.belongsToMany(models.Task, {
        through: models.TaskAssignee,
        foreignKey: 'userId',
        otherKey: 'taskId',
        as: 'tasksAssigned',
      });
    }

    // Owner reverse association
    if (models.User && !models.User.associations?.tasksOwned) {
      models.User.hasMany(models.Task, {
        foreignKey: 'ownerId',
        as: 'tasksOwned',
      });
    }
  };

  return Task;
}; 