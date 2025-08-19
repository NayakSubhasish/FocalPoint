-- Create Breaks table
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
    PRINT 'Breaks table created successfully';
END
ELSE
BEGIN
    PRINT 'Breaks table already exists';
END
GO
