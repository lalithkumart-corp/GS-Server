ALTER TABLE `gs`.`pledgebook_1` 
ADD COLUMN `UniqueIdentifier` VARCHAR(45) NULL AFTER `Id`,
ADD COLUMN `BillNo` VARCHAR(45) NULL AFTER `UniqueIdentifier`,
ADD COLUMN `Amount` INT(11) NULL AFTER `BillNo`,
ADD COLUMN `Date` VARCHAR(45) NULL AFTER `Amount`,
ADD COLUMN `CustomerId` INT(11) NULL AFTER `Date`,
--ADD COLUMN `ImageId` INT(11) NULL AFTER `CustomerId`,
ADD COLUMN `Orn` VARCHAR(500) NULL AFTER `ImageId`,
ADD COLUMN `Remarks` TEXT NULL AFTER `Orn`,
ADD COLUMN `CreatedDate` DATETIME NULL AFTER `Remarks`,
ADD COLUMN `ModifiedDate` DATETIME NULL AFTER `CreatedDate`;


ALTER TABLE `gsprod`.`pledgebook_1` 
ADD COLUMN `Alert` INT NULL AFTER `History`;
