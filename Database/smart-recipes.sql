-- MySQL dump 10.13  Distrib 8.0.42, for macos15 (arm64)
--
-- Host: localhost    Database: smart-recipes
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `imageName_UNIQUE` (`imageName`),
  KEY `recipeToUser_idx` (`userId`),
  CONSTRAINT `recipeToUser` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=180 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--

LOCK TABLES `recipe` WRITE;
/*!40000 ALTER TABLE `recipe` DISABLE KEYS */;
INSERT INTO `recipe` VALUES (178,'Unsweetened Vanilla Ice Cream','Heavy cream, Whole milk, Egg yolk, Vanilla extract, Pinch of fine salt','In a small saucepan, whisk together the heavy cream, whole milk, egg yolk, vanilla extract, and a pinch of salt until smooth. | Place over low heat and cook, stirring constantly with a spatula, until the mixture slightly thickens and lightly coats the back of the spatula (do not let it boil). | Pour the mixture into a shallow, freezer‑safe container, cool to room temperature, then cover and chill in the refrigerator until completely cold, about 2 hours. | Freeze for 2–3 hours, stirring the mixture well with a fork every 30–45 minutes to break up ice crystals, until it becomes smooth and scoopable. | Let sit at room temperature for 3–5 minutes to soften slightly, then scoop and serve immediately.','[\"1/2 cup\",\"1/4 cup\",\"1 large\",\"1/2 teaspoon\",\"1 small pinch\"]',260,'ice-cream-recipe.png','Simple, classic vanilla ice cream made without any added sugar, rich and creamy but naturally unsweetened.',3,3,5,4,1,9,'2','0','0','0','0','[]'),(179,'Vanilla ice cream with cookies (low sugar, single serving)','Heavy cream (cold), Whole milk (cold), Vanilla extract, Granulated sugar, Low-sugar chocolate sandwich cookies, roughly chopped','In a small bowl, whisk together the cold heavy cream, whole milk, vanilla extract and sugar until the sugar mostly dissolves. | Pour the mixture into a shallow freezer-safe container and freeze for about 45–60 minutes, until the edges start to firm up. | Stir the partially frozen mixture with a fork or whisk to break up ice crystals, then freeze another 45 minutes. | Stir again, then quickly fold in the chopped low-sugar cookies, spreading them evenly through the mixture. | Freeze 1–2 more hours, until firm enough to scoop. Let sit at room temperature for 3–5 minutes before serving.','[\"80 ml\",\"40 ml\",\"0.5 teaspoon\",\"1 teaspoon\",\"1–2 cookies (about 15 g)\"]',260,'ice-cream-vanilla-and-cookies-recipe.png','Quick vanilla ice cream with crunchy chocolate cookies, adjusted to be moderately low in added sugar for one serving.',0,14,3,4,1,9,'1','0','0','0','0','[]');
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
  `phoneNumber` varchar(45) NOT NULL,
  `Gender` enum('MALE','FEMALE','OTHER') NOT NULL,
  `birthDate` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (9,'Yitzchak ','Templeman','itzik.templeman@gmail.com','72ec8a5e670b9207989966cd2b5e38a0167d28d563771dec5009d6269ef55121cacde4a0348da5a68b4108cf15a3464f5c6e3f0618082c71e60603416489b0aa','0545408531','MALE','1991-09-26'),(10,'Isaak2','Templeman','isaktem@gmail.com','72ec8a5e670b9207989966cd2b5e38a0167d28d563771dec5009d6269ef55121cacde4a0348da5a68b4108cf15a3464f5c6e3f0618082c71e60603416489b0aa','1234','MALE','1995-04-11'),(11,'Yitzchak D','Templeman','itzik.templeman2@gmail.com','4b83fc0668524ec0b513644098cfe0519bb6c728caafe31ae0a45bf5c4a71089718562beac1b02a9fa063942f4c1a075b861af8f9348679e2e58a4d5185117a6','0545408532','MALE','2025-10-29'),(12,'Daniel','Cohen','dani@gmail.com','4b83fc0668524ec0b513644098cfe0519bb6c728caafe31ae0a45bf5c4a71089718562beac1b02a9fa063942f4c1a075b861af8f9348679e2e58a4d5185117a6','0545408521','FEMALE','2004-06-08'),(13,'Liad ','Cohen','liadd@gmail.com','96e24a83633c01b3bf803f0470cddc9f2a589de84e125deeb732569d1d5aaefbb16b92254e1e86a7669d3afeb789081b4c41c10fbdf8315fa5308f6705e5ae83','0508339255','MALE','2007-07-15'),(14,'liadd ','chh','l@g.c','e858c01e79418ca8f71a8e01794518091c63290fa5997c456a46f990fb9c07071ae9b783414315e2f13b06fa1be4ed8bad1a1f1cbf6606fe29a1a80a91d2791d','0545408531','MALE','1982-06-08');
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

-- Dump completed on 2025-12-04 10:44:36
