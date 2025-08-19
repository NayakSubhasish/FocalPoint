const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Break = sequelize.define('Break', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
  },
  type: {
    type: DataTypes.ENUM('coffee', 'lunch', 'meeting', 'other'),
    allowNull: false,
    defaultValue: 'other',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  duration: {
    type: DataTypes.INTEGER, // Duration in minutes
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  }, {
    tableName: 'breaks',
    timestamps: true,
    hooks: {
      beforeSave: (breakRecord) => {
        // Calculate duration if both start and end times are provided
        if (breakRecord.startTime && breakRecord.endTime) {
          const start = new Date(breakRecord.startTime);
          const end = new Date(breakRecord.endTime);
          const diffInMs = end - start;
          breakRecord.duration = Math.round(diffInMs / (1000 * 60)); // Convert to minutes
        }
        
        // Set isActive based on whether endTime is set
        if (breakRecord.endTime) {
          breakRecord.isActive = false;
        }
      },
    },
  });

  // Define associations
  Break.associate = (models) => {
    Break.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return Break;
};
