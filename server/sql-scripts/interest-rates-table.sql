CREATE TABLE `gs`.`interest_rates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `range_from` INT(50) NULL,
  `range_to` INT(50) NULL,
  `rate_of_interest` INT(50) NULL,
  PRIMARY KEY (`id`));


ALTER TABLE `gs`.`interest_rates` 
ADD COLUMN `type` VARCHAR(45) NULL AFTER `id`;

ALTER TABLE `gs`.`interest_rates` 
ADD COLUMN `user_id` INT(11) NULL AFTER `id`;
