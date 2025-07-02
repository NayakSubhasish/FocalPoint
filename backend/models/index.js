const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,         // 'TaskTracker'
  process.env.DB_USER,         // 'tasktracker_subhasish'
  process.env.DB_PASSWORD,     // 'g]?>.2#22ZW%'
  {
    host: process.env.DB_HOST, // '50.28.38.144'
    port: process.env.DB_PORT, // 1433 (default for MSSQL, not 3306)
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: false, // or true if required
        trustServerCertificate: true
      }
    },
    logging: false,
  }
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize);
db.Project = require('./Project')(sequelize, Sequelize);
db.ProjectTeam = require('./ProjectTeam')(sequelize, Sequelize);
db.Task = require('./Task')(sequelize, Sequelize);
db.TimeEntry = require('./TimeEntry')(sequelize, Sequelize);

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Import seeders
const adminSeeder = require('../seeders/adminSeeder');

// Sync database and run seeders
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('Database synced successfully');
    try {
      // Check if admin exists
      const adminExists = await db.User.findOne({ where: { email: 'admin@project.com' } });
      if (!adminExists) {
        await adminSeeder.up(db.sequelize.getQueryInterface(), Sequelize);
        console.log('Admin user created successfully');
      }
    } catch (error) {
      console.error('Error running seeders:', error);
    }
  })
  .catch((err) => {
    console.error('Error syncing database:', err);
  });

module.exports = db; 