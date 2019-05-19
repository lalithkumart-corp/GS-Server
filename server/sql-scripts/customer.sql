ALTER TABLE `gs`.`customer` 
CHANGE COLUMN `UserId` `UserId` INT(11) NULL DEFAULT NULL AFTER `CustomerId`;

ALTER TABLE `gs`.`customer` 
ADD COLUMN `SecMobile` BIGINT(20) NULL DEFAULT NULL AFTER `Mobile`;

ALTER TABLE `gs`.`customer` 
ADD COLUMN `Notes` TEXT NULL DEFAULT NULL AFTER `OtherDetails`;
