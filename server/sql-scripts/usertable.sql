ALTER TABLE `gs`.`user` 
ADD COLUMN `ownerId` INT(11) NULL DEFAULT 0 AFTER `id`;
