CREATE TABLE `gs`.`pledgebook_settings` (
 `s_no` INT NOT NULL AUTO_INCREMENT,
 `bill_series` VARCHAR(45) NULL,
 `last_created_bill_no` INT(45) NULL,
 `bill_start` INT(45) NULL,
 `bill_limit` INT(45) NULL, 
 PRIMARY KEY (`s_no`));


ALTER TABLE `gs`.`pledgebook_settings` 
ADD COLUMN `user_id` INT(11) NOT NULL AFTER `s_no`,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`s_no`, `user_id`);
