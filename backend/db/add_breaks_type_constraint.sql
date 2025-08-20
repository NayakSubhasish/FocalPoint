-- Ensure 'meeting' value exists in CK_Breaks_Type constraint for breaks table
USE TaskTracker;
GO

-- Drop existing constraint if it exists
IF EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Breaks_Type')
BEGIN
    ALTER TABLE dbo.breaks DROP CONSTRAINT CK_Breaks_Type;
END

-- Re-create the constraint with updated list
ALTER TABLE dbo.breaks
    ADD CONSTRAINT CK_Breaks_Type CHECK (type IN ('coffee', 'lunch', 'meeting', 'other'));
GO

PRINT 'CK_Breaks_Type constraint refreshed to allow meeting value';
GO
