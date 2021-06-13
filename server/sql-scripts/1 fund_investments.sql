DROP TABLE IF EXISTS `fund_houses`;
CREATE TABLE `fund_houses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name_UNIQUE` (`name`)
);

DROP TABLE IF EXISTS `fund_transactions`;
CREATE TABLE `fund_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `fund_house_id` varchar(45) DEFAULT NULL,
  `transaction_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `amount` int NOT NULL DEFAULT '0',
  `category` varchar(45) DEFAULT NULL,
  `remarks` text,
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `modified_date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
