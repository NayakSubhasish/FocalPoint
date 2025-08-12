-- Migration script to add CHECK constraints for transactionType enum values
-- Run this script on existing databases to fix the "charts" validation error

USE TaskTracker;
GO

-- Add CHECK constraints to Tasks table if they don't exist
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Tasks_Status')
BEGIN
    ALTER TABLE dbo.Tasks ADD CONSTRAINT CK_Tasks_Status CHECK (status IN ('todo', 'in_progress', 'review', 'completed'));
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Tasks_Priority')
BEGIN
    ALTER TABLE dbo.Tasks ADD CONSTRAINT CK_Tasks_Priority CHECK (priority IN ('low', 'medium', 'high'));
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Tasks_TransactionType')
BEGIN
    ALTER TABLE dbo.Tasks ADD CONSTRAINT CK_Tasks_TransactionType CHECK (transactionType IS NULL OR transactionType IN ('pages', 'images', 'records', 'charts'));
END

-- Add CHECK constraint to TimeEntry table if it doesn't exist
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_TimeEntry_TransactionType')
BEGIN
    ALTER TABLE dbo.TimeEntry ADD CONSTRAINT CK_TimeEntry_TransactionType CHECK (transactionType IS NULL OR transactionType IN ('pages', 'images', 'records', 'charts'));
END

PRINT 'CHECK constraints added successfully!';
GO 