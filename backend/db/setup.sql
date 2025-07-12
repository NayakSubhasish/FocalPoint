-- FocalPoint SQL Server schema and permissions script
-- Run this as a database administrator

-- Create database if it doesn't exist
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'TaskTracker')
BEGIN
    CREATE DATABASE TaskTracker;
END
GO

USE TaskTracker;
GO

-- Create Users table
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(20) NOT NULL DEFAULT 'team_member',
        isActive BIT NOT NULL DEFAULT 1,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
    );
END
GO

-- Create Projects table
IF OBJECT_ID('dbo.Projects', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Projects (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NTEXT NOT NULL,
        startDate DATETIME2 NULL,
        endDate DATETIME2 NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'planning',
        billingMethod NVARCHAR(20) NOT NULL DEFAULT 'hourly',
        estimatedHours INT NOT NULL DEFAULT 0,
        estimatedTransactions INT NOT NULL DEFAULT 0,
        managerId INT NOT NULL,
        teamLeaderId INT NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Projects_Manager FOREIGN KEY (managerId) REFERENCES dbo.Users(id),
        CONSTRAINT FK_Projects_TeamLeader FOREIGN KEY (teamLeaderId) REFERENCES dbo.Users(id)
    );
END
GO

-- Create ProjectTeam table
IF OBJECT_ID('dbo.ProjectTeam', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProjectTeam (
        id INT IDENTITY(1,1) PRIMARY KEY,
        projectId INT NOT NULL,
        userId INT NOT NULL,
        role NVARCHAR(10) NOT NULL DEFAULT 'member',
        joinedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ProjectTeam_Project FOREIGN KEY (projectId) REFERENCES dbo.Projects(id),
        CONSTRAINT FK_ProjectTeam_User FOREIGN KEY (userId) REFERENCES dbo.Users(id),
        CONSTRAINT UQ_ProjectTeam_ProjectUser UNIQUE (projectId, userId)
    );
END
GO

-- Create Tasks table
IF OBJECT_ID('dbo.Tasks', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Tasks (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NTEXT NULL,
        projectId INT NOT NULL,
        assignedTo INT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'todo',
        priority NVARCHAR(10) NOT NULL DEFAULT 'medium',
        estimatedTransactions INT NOT NULL DEFAULT 0,
        transactionType NVARCHAR(10) NULL,
        estimatedHours FLOAT NOT NULL DEFAULT 0,
        deadline DATETIME2 NULL,
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Tasks_Project FOREIGN KEY (projectId) REFERENCES dbo.Projects(id),
        CONSTRAINT FK_Tasks_Assignee FOREIGN KEY (assignedTo) REFERENCES dbo.Users(id)
    );
END
GO

-- Create TimeEntry table
IF OBJECT_ID('dbo.TimeEntry', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TimeEntry (
        id INT IDENTITY(1,1) PRIMARY KEY,
        userId INT NOT NULL,
        taskId INT NOT NULL,
        hours FLOAT NOT NULL DEFAULT 0,
        transactions INT NOT NULL DEFAULT 0,
        transactionType NVARCHAR(10) NULL,
        date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
        createdAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        updatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_TimeEntry_User FOREIGN KEY (userId) REFERENCES dbo.Users(id),
        CONSTRAINT FK_TimeEntry_Task FOREIGN KEY (taskId) REFERENCES dbo.Tasks(id)
    );
END
GO

-- Create login and database user, then grant permissions
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'tasktracker_subhasish')
BEGIN
    CREATE LOGIN tasktracker_subhasish WITH PASSWORD = 'g]?>.2#22ZW%';
END
GO

USE TaskTracker;
GO

IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'tasktracker_subhasish')
BEGIN
    CREATE USER tasktracker_subhasish FOR LOGIN tasktracker_subhasish;
END
GO

-- Grant necessary permissions
GRANT CREATE TABLE TO tasktracker_subhasish;
GRANT SELECT, INSERT, UPDATE, DELETE ON SCHEMA :: dbo TO tasktracker_subhasish;
GO 