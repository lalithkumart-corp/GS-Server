ALTER TABLE `gs`.`user` 
ADD COLUMN `ownerId` INT(11) NULL DEFAULT 0 AFTER `id`;

ALTER TABLE `gs`.`user` 
ADD COLUMN `guardianName` VARCHAR(512) NULL AFTER `username`;
