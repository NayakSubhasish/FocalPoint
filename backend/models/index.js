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
db.Break = require('./Break')(sequelize, Sequelize);

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

      // Drop and recreate transactionType constraints to include 'charts'
      console.log('Updating transactionType constraints to include charts...');
      
      // Drop existing constraints
      await sequelize.query("IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK__Tasks__transacti__01C9240F') ALTER TABLE Tasks DROP CONSTRAINT CK__Tasks__transacti__01C9240F;");
      await sequelize.query("IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK__TimeEntri__trans__096A45D7') ALTER TABLE TimeEntries DROP CONSTRAINT CK__TimeEntri__trans__096A45D7;");
      
      // Sync database schema (alter existing tables) - skip if there are constraint issues
      try {
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully (with schema alterations)');
      } catch (syncError) {
        console.log('Database sync with alterations failed, trying force sync for new tables only...');
        // Only sync new tables that don't exist
        await sequelize.sync({ force: false });
        console.log('Database synced successfully (new tables only)');
      }

      // Add new constraints that include 'charts' - only if they don't exist
      try {
        await sequelize.query("ALTER TABLE Tasks ADD CONSTRAINT CK_Tasks_TransactionType CHECK (transactionType IS NULL OR transactionType IN ('pages', 'images', 'records', 'charts'));");
        console.log('Tasks transaction type constraint added');
      } catch (constraintError) {
        console.log('Tasks constraint already exists or failed:', constraintError.message);
      }
      
      try {
        await sequelize.query("ALTER TABLE TimeEntries ADD CONSTRAINT CK_TimeEntries_TransactionType CHECK (transactionType IS NULL OR transactionType IN ('pages', 'images', 'records', 'charts'));");
        console.log('TimeEntries transaction type constraint added');
      } catch (constraintError) {
        console.log('TimeEntries constraint already exists or failed:', constraintError.message);
      }

      // Create breaks table if it doesn't exist
      try {
        await sequelize.query(`
          IF OBJECT_ID('dbo.breaks', 'U') IS NULL
          BEGIN
              CREATE TABLE dbo.breaks (
                  id INT IDENTITY(1,1) PRIMARY KEY,
                  userId INT NOT NULL,
                  type NVARCHAR(20) NOT NULL DEFAULT 'other',
                  description NTEXT NULL,
                  startTime DATETIME2 NOT NULL DEFAULT GETDATE(),
                  endTime DATETIME2 NULL,
                  duration INT NULL,
                  isActive BIT NOT NULL DEFAULT 1,
                  createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                  updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
                  CONSTRAINT FK_Breaks_User FOREIGN KEY (userId) REFERENCES dbo.Users(id),
                  CONSTRAINT CK_Breaks_Type CHECK (type IN ('coffee', 'lunch', 'meeting', 'other'))
              );
          END
        `);
        console.log('Breaks table created successfully');
      } catch (tableError) {
        console.log('Breaks table creation error (might already exist):', tableError.message);
      }

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