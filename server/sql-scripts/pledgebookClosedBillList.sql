CREATE TABLE `gs`.`pledgebook_closed_bills` (
  `id` INT NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`));


ALTER TABLE `gs`.`pledgebook_closed_bills` 
ADD COLUMN 'pledgebook_uid' VARCHAR(45) NOT NULL AFTER 'id',
ADD COLUMN `bill_no` VARCHAR(45) NOT NULL AFTER `pledgebook_uid`,
ADD COLUMN `pledged_date` VARCHAR(45) NULL AFTER `bill_no`,
ADD COLUMN `closed_date` VARCHAR(45) NULL AFTER `pledged_date`,
ADD COLUMN `principal_amt` INT(50) NULL AFTER `closed_date`,
ADD COLUMN `no_of_month` INT(20) NULL AFTER `principal_amt`,
ADD COLUMN `rate_of_interest` VARCHAR(45) NULL AFTER `no_of_month`,
ADD COLUMN `int_rupee_per_month` VARCHAR(45) NULL AFTER `rate_of_interest`,
ADD COLUMN `interest_amt` VARCHAR(45) NULL AFTER `int_rupee_per_month`,
ADD COLUMN `actual_estimated_amt` VARCHAR(45) NULL AFTER `interest_amt`,
ADD COLUMN `discount_amt` VARCHAR(45) NULL AFTER `actual_estimated_amt`,
ADD COLUMN `paid_amt` VARCHAR(45) NULL AFTER `discount_amt`,
ADD COLUMN `handed_over_to_person` VARCHAR(100) NULL AFTER `paid_amt`;
DROP PRIMARY KEY,
ADD PRIMARY KEY (`id`, `pledgebook_uid`);