const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 1433,
    dialect: 'mssql',
    dialectOptions: {
      options: {
        encrypt: false,
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

// Run database sync and seed only in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment is development: syncing database...');
  sequelize.sync()
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
      if (err.parent) {
        console.error('Database error details:', err.parent.message);
      }
      if (err.original) {
        console.error('Original error object:', err.original);
      }
    });
} else {
  console.log('Production environment detected: skipping database sync. Ensure the DB schema is already created.');
}

module.exports = db; 