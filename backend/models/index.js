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
db.TaskAssignee = require('./TaskAssignee')(sequelize, Sequelize);

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
  (async () => {
    try {
      console.log('Environment is development: preparing database...');
      const qi = sequelize.getQueryInterface();
      // If Tasks table exists and lacks ownerId, add the column first so that later sync doesn't fail on index creation
      try {
        const taskDesc = await qi.describeTable('Tasks');
        if (!taskDesc.ownerId) {
          console.log('Adding missing ownerId column to Tasks table...');
          await qi.addColumn('Tasks', 'ownerId', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
              model: 'Users',
              key: 'id',
            },
          });
          console.log('ownerId column added successfully');
        }
      } catch (tblErr) {
        if (tblErr.original && tblErr.original.number === 208) {
          // Table does not exist yet (fresh DB); ignore
        } else {
          console.warn('Could not inspect Tasks table:', tblErr.message);
        }
      }

      // If TimeEntries table lacks fileName column, add it
      const timeEntryDesc = await qi.describeTable('TimeEntries');
      if (!timeEntryDesc.fileName) {
        console.log('Adding missing fileName column to TimeEntries table...');
        await qi.addColumn('TimeEntries', 'fileName', { type: Sequelize.STRING, allowNull: true });
        console.log('fileName column added successfully');
      }

      // Drop existing transactionType CHECK constraints so 'charts' is accepted
      console.log('Dropping transactionType CHECK constraints if they exist...');
      await sequelize.query("IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Tasks_TransactionType') ALTER TABLE dbo.Tasks DROP CONSTRAINT CK_Tasks_TransactionType;");
      await sequelize.query("IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_TimeEntry_TransactionType') ALTER TABLE dbo.TimeEntry DROP CONSTRAINT CK_TimeEntry_TransactionType;");
      // Sync database schema (alter existing tables)
      await sequelize.sync({ alter: true });
      console.log('Database synced successfully (with schema alterations)');

      // Seed admin user if needed
      try {
        const adminExists = await db.User.findOne({ where: { email: 'admin@project.com' } });
        if (!adminExists) {
          await adminSeeder.up(qi, Sequelize);
          console.log('Admin user created successfully');
        }
      } catch (seedErr) {
        console.error('Error running seeders:', seedErr);
      }
    } catch (err) {
      console.error('Error syncing database:', err);
      if (err.parent) {
        console.error('Database error details:', err.parent.message);
      }
      if (err.original) {
        console.error('Original error object:', err.original);
      }
    }
  })();
} else {
  console.log('Production environment detected: skipping database sync. Ensure the DB schema is already created.');
}

module.exports = db; 