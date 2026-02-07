-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (arm64)
--
-- Host: localhost    Database: smart-recipes
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `smart-recipes`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `smart-recipes` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `smart-recipes`;

--
-- Table structure for table `dailySuggestions`
--

DROP TABLE IF EXISTS `dailySuggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dailySuggestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `suggestionDate` date NOT NULL,
  `recipeId` int NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `suggestionsToRecipe_idx` (`recipeId`),
  CONSTRAINT `suggestionsToRecipe` FOREIGN KEY (`recipeId`) REFERENCES `recipe` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dailySuggestions`
--

LOCK TABLES `dailySuggestions` WRITE;
/*!40000 ALTER TABLE `dailySuggestions` DISABLE KEYS */;
/*!40000 ALTER TABLE `dailySuggestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `userId` int NOT NULL,
  `recipeId` int NOT NULL,
  PRIMARY KEY (`userId`,`recipeId`),
  KEY `likesToRecipe_idx` (`recipeId`),
  CONSTRAINT `likesToRecipe` FOREIGN KEY (`recipeId`) REFERENCES `recipe` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `likesToUsers` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (43,471),(43,472);
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `passwordReset`
--

DROP TABLE IF EXISTS `passwordReset`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `passwordReset`
--

LOCK TABLES `passwordReset` WRITE;
/*!40000 ALTER TABLE `passwordReset` DISABLE KEYS */;
/*!40000 ALTER TABLE `passwordReset` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe`
--

DROP TABLE IF EXISTS `recipe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  CONSTRAINT `recipeToUser` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=473 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--

LOCK TABLES `recipe` WRITE;
/*!40000 ALTER TABLE `recipe` DISABLE KEYS */;
INSERT INTO `recipe` VALUES (470,'Vanilla Milkshake','vanilla ice cream, whole milk, white sugar, vanilla extract','Place a tall glass in the freezer for 5 minutes so the milkshake stays cold on contact. | Add the vanilla ice cream, whole milk, white sugar, and vanilla extract to a blender jar. | Blend on low for 10 seconds to break up the ice cream, then blend on high for 20–30 seconds until smooth, thick, and glossy; stop and scrape down the sides with a spatula if needed, then blend 5 seconds more. | Pour into the chilled glass immediately; the milkshake should mound slightly before settling and be thick enough to drink through a wide straw.','[\"1½ cups\",\"½ cup\",\"1 tablespoon\",\"½ teaspoon\"]',520,'vanilla-milkshake-recipe.png','A classic milkshake blended until thick and smooth, finished with vanilla and a small amount of sugar.',10,1,6,2,1,43,'0','0','0','0','0','[]',7,'EASY','United States'),(471,'Buttermilk Pancakes','flour, buttermilk, egg, canola oil, baking powder, white sugar, salt','Set a 20 cm nonstick skillet over medium heat for 3 minutes, until a drop of water sizzles and evaporates quickly; lightly brush the surface with a thin film of canola oil. | Whisk flour, baking powder, white sugar, and salt in a medium bowl for 20 seconds to evenly distribute the leavening. | In a small bowl, whisk buttermilk and egg for 20 seconds until smooth, then pour into the dry ingredients and whisk just until no dry flour remains; let the batter rest 5 minutes until it looks slightly thicker and small bubbles appear on the surface. | Spoon the batter into the hot skillet in 2 rounds (about ¼ cup batter each) and cook 2–3 minutes, until bubbles rise and pop on top and the edges look set and slightly dry. | Flip with a thin spatula and cook 1–2 minutes more, until the second side is golden-brown and the centers spring back when lightly pressed; repeat with the remaining batter, brushing the pan with a little more canola oil only if it looks dry.','[\"½ cup\",\"½ cup\",\"1 large\",\"1 tablespoon\",\"1 teaspoon\",\"1 tablespoon\",\"¼ teaspoon\"]',520,'pancakes-recipe.png','Classic stovetop pancakes with a tender crumb and lightly browned edges.',10,1,8,4,1,43,'0','0','0','0','0','[]',18,'EASY','United States'),(472,'Hamburger','ground beef (80/20), hamburger bun, tomato slice, iceberg lettuce leaf, yellow onion, thin slices, pickle slices, canola oil, mayonnaise, ketchup, mustard, salt, black pepper','Set a 25 cm cast-iron skillet over medium-high heat until very hot, about 3 minutes (a drop of water should sizzle and evaporate quickly). | Place the ground beef in a medium bowl, sprinkle with the salt and black pepper, and gently fold with your fingertips just until evenly distributed (about 20 seconds; do not knead). | Shape the meat into a patty about 11 cm wide and 2 cm thick; handle lightly so it stays tender. Press a shallow 5 cm wide dimple (about ½ cm deep) in the center to prevent puffing. | Add the canola oil to the hot skillet and swirl to coat. Lay in the patty and cook undisturbed for 3½–4 minutes, until a deep brown crust forms and the edges look browned and slightly crisp. | Flip with a spatula and cook 3–4 minutes more, until the second side is deeply browned and the patty feels firm around the edges. For medium doneness, an instant-read thermometer inserted from the side should read about 63°C; cook 1–2 minutes longer for more doneness. | Transfer the patty to a plat','[\"170 g\",\"1\",\"1\",\"1\",\"2 slices\",\"2 slices\",\"1 tsp\",\"1 tbsp\",\"1 tbsp\",\"1 tsp\",\"¼ tsp\",\"⅛ tsp\"]',740,'hamburger-recipe.png','A classic beef hamburger with a pan-seared patty, toasted bun, and traditional toppings.',10,0,15,4,1,43,'0','0','0','0','0','[]',20,'EASY','United States');
/*!40000 ALTER TABLE `recipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (43,'Itzik','Templeman','itzik.templeman@gmail.com','72ec8a5e670b9207989966cd2b5e38a0167d28d563771dec5009d6269ef55121cacde4a0348da5a68b4108cf15a3464f5c6e3f0618082c71e60603416489b0aa',NULL,NULL,NULL,'80fda2ee-7724-4405-9683-ce89d595cafc.jpg');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-08  0:39:03
