ALTER TABLE `gs`.`pledgebook` 
ADD COLUMN `Amount` INT(11) NULL AFTER `BillNo`;


ALTER TABLE `gs`.`pledgebook` 
ADD COLUMN `Status` INT(11) NOT NULL DEFAULT 1 AFTER `Remarks`,
ADD COLUMN `History` TEXT NULL AFTER `Status`;


ALTER TABLE `gs`.`pledgebook` 
ADD COLUMN `closedBillReference` VARCHAR(45) NULL DEFAULT NULL AFTER `Status`;

ALTER TABLE `gs`.`pledgebook` 
ADD COLUMN `OrnPictureId` INT(11) NULL DEFAULT NULL AFTER `Remarks`;
