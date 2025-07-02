const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin', 'project_manager', 'team_member', 'team_leader'),
      defaultValue: 'team_member',
      allowNull: false,
      validate: {
        isIn: [['admin', 'project_manager', 'team_member', 'team_leader']],
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          console.log('Before create - Original password:', user.password);
          const salt = await bcrypt.genSalt(10);
          console.log('Generated salt:', salt);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('Hashed password:', user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          console.log('Before update - Original password:', user.password);
          const salt = await bcrypt.genSalt(10);
          console.log('Generated salt:', salt);
          user.password = await bcrypt.hash(user.password, salt);
          console.log('Hashed password:', user.password);
        }
      },
    },
    timestamps: true,
  });

  // Instance method to check password
  User.prototype.validatePassword = async function(password) {
    console.log('Validating password:');
    console.log('Input password:', password);
    console.log('Stored hashed password:', this.password);
    const isMatch = await bcrypt.compare(password, this.password);
    console.log('Password match result:', isMatch);
    return isMatch;
  };

  return User;
}; 

