const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const ProjectTeam = sequelize.define('ProjectTeam', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Projects',
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
    role: {
      type: DataTypes.ENUM('member', 'lead'),
      defaultValue: 'member',
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    indexes: [
      {
        fields: ['projectId'],
      },
      {
        fields: ['userId'],
      },
      {
        unique: true,
        fields: ['projectId', 'userId'],
      },
    ],
  });

  return ProjectTeam;
}; 