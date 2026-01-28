DROP TABLE IF EXISTS `likes`;

CREATE TABLE `likes` (
  `userId` int NOT NULL,
  `recipeId` int NOT NULL,
  PRIMARY KEY (`userId`,`recipeId`),
  KEY `likesToRecipe_idx` (`recipeId`),
  CONSTRAINT `likesToRecipe` FOREIGN KEY (`recipeId`) REFERENCES `recipe` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likesToUsers` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `likes` WRITE;

UNLOCK TABLES;

DROP TABLE IF EXISTS `passwordReset`;

CREATE TABLE `passwordReset` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `tokenHash` varchar(64) NOT NULL,
  `exp` datetime NOT NULL,
  `created` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usedAt` datetime DEFAULT NULL,
  `passwordResetcol` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `passwordResetToUser_idx` (`userId`),
  CONSTRAINT `passwordResetToUser` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


LOCK TABLES `passwordReset` WRITE;

UNLOCK TABLES;

DROP TABLE IF EXISTS `recipe`;

CREATE TABLE `recipe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(160) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `ingredients` varchar(350) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `instructions` varchar(1000) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `amounts` varchar(2000) COLLATE utf8mb4_general_ci NOT NULL,
  `calories` int NOT NULL,
  `imageName` varchar(140) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `description` varchar(1000) COLLATE utf8mb4_general_ci NOT NULL,
  `popularity` int NOT NULL,
  `totalSugar` int NOT NULL,
  `totalProtein` int NOT NULL,
  `healthLevel` int NOT NULL,
  `amountOfServings` int NOT NULL,
  `userId` int NOT NULL,
  `sugarRestriction` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `lactoseRestrictions` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `glutenRestrictions` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `dietaryRestrictions` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `caloryRestrictions` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  `queryRestrictions` varchar(256) COLLATE utf8mb4_general_ci NOT NULL,
  `prepTime` int NOT NULL,
  `difficultyLevel` enum('EASY','MID_LEVEL','PRO') COLLATE utf8mb4_general_ci NOT NULL,
  `countryOfOrigin` varchar(45) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `recipeToUser_idx` (`userId`),
  CONSTRAINT `recipeToUser` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=462 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

LOCK TABLES `recipe` WRITE;

UNLOCK TABLES;

DROP TABLE IF EXISTS `user`;

CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `firstName` varchar(45) NOT NULL,
  `familyName` varchar(45) NOT NULL,
  `email` varchar(45) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phoneNumber` varchar(45) DEFAULT NULL,
  `Gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `birthDate` date DEFAULT NULL,
  `imageName` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `imageName_UNIQUE` (`imageName`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

LOCK TABLES `user` WRITE;

UNLOCK TABLES;
