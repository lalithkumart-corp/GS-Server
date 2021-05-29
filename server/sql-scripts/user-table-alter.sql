ALTER TABLE `gsprod`.`user` 
ADD COLUMN `gateway` VARCHAR(45) NULL DEFAULT 'direct' AFTER `verificationToken`,
ADD COLUMN `sso_userid` VARCHAR(45) NULL DEFAULT NULL AFTER `gateway`;

ALTER TABLE `gsprod`.`accesstoken` 
ADD COLUMN `sso_token` TEXT NULL AFTER `userId`;


INSERT INTO `gsprod`.`acl` (`model`, `property`, `accessType`, `permission`, `principalType`, `principalId`) VALUES ('GsUser', 'checkEmailExistance', '*', 'ALLOW', 'ROLE', '$everyone');
INSERT INTO `gsprod`.`acl` (`model`, `property`, `accessType`, `permission`, `principalType`, `principalId`) VALUES ('GsUser', 'ssoLogin', '*', 'ALLOW', 'ROLE', '$everyone');
