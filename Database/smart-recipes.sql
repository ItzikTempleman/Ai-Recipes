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
  CONSTRAINT `likesToRecipe` FOREIGN KEY (`recipeId`) REFERENCES `recipe` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likesToUsers` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
INSERT INTO `likes` VALUES (21,450),(21,451),(21,454),(21,455);
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
  `created` datetime NOT NULL,
  `usedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `passwordResetToUser_idx` (`userId`),
  CONSTRAINT `passwordResetToUser` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  CONSTRAINT `recipeToUser` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=456 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--

LOCK TABLES `recipe` WRITE;
/*!40000 ALTER TABLE `recipe` DISABLE KEYS */;
INSERT INTO `recipe` VALUES (450,'Beef Hamburger','ground beef (80/20), hamburger bun, tomato slice, lettuce leaf, onion slices, canola oil, mayonnaise, ketchup, yellow mustard, salt, black pepper','Preheat a 25 cm cast-iron skillet over medium-high heat until very hot, about 3 minutes (a drop of water should sizzle and evaporate quickly). | Place the ground beef in a medium bowl and sprinkle evenly with the salt and black pepper. Mix with your fingertips just until combined, 10–15 seconds, without compacting the meat. | Shape the meat into a patty about 11 cm wide and 2 cm thick. Press a shallow dimple (about 5 cm wide) into the center with your thumb to prevent bulging. | Add the canola oil to the hot skillet and swirl to coat. Lay the patty in the skillet and cook undisturbed for 3½–4 minutes, until a deep brown crust forms and the edges look browned. | Flip with a spatula and cook 3–4 minutes more for medium (about 63°C in the center) or 4–5 minutes for well-done (about 71°C), until the patty feels firmer and juices run mostly clear. Transfer to a plate and rest 2 minutes. | Reduce heat to medium. Split the bun and toast cut-side down in the same skillet for 45–75 seconds, pre','[\"170 g\",\"1\",\"1 thick slice\",\"1\",\"2 slices\",\"1 tsp\",\"1 tbsp\",\"1 tbsp\",\"1 tsp\",\"½ tsp\",\"¼ tsp\"]',700,'beef-hamburger-recipe.png','A classic skillet-cooked beef patty on a toasted bun with crisp lettuce, tomato, onion, and simple condiments.',10,0,12,4,1,21,'0','0','0','0','0','[]',20,'EASY','United States'),(451,'Buttermilk Pancakes','flour, buttermilk, large egg, canola oil, baking powder, granulated sugar, salt, vanilla extract','Place a fine-mesh sieve over a medium bowl, add the flour, baking powder, sugar, and salt, then sift to combine; make a well in the center. | In a small bowl, whisk the buttermilk, egg, vanilla extract, and 1 tablespoon of the canola oil for 20–30 seconds until smooth. | Pour the wet mixture into the well and fold with a spatula just until no dry flour remains; the batter should look lumpy and thick. Rest the batter for 5 minutes at room temperature. | Heat a 25 cm nonstick skillet over medium heat until a drop of water sizzles on contact (about 175–185°C). Brush the pan with the remaining ½ tablespoon canola oil. | Scoop about ¼ cup batter per pancake into the skillet, leaving space between them. Cook 2–3 minutes, until bubbles form across the surface and the edges look set and slightly dry. | Flip with a thin spatula and cook 1½–2 minutes more, until the second side is golden-brown and the pancakes spring back slightly when pressed in the center. Transfer to a plate and repeat with r','[\"1 cup\",\"¾ cup\",\"1\",\"1½ tablespoons\",\"1½ teaspoons\",\"1 teaspoon\",\"¼ teaspoon\",\"½ teaspoon\"]',640,'pancakes-recipe.png','Classic skillet pancakes with a lightly sweet batter, cooked until browned and fluffy.',10,0,7,5,2,21,'1','0','0','2','0','[\"maple syrope\"]',20,'EASY','United States'),(454,'אסאדו בתנור','שפונדרה בקר (אסאדו) עם עצם, מים, בצל, גזר, שום, שמן זית, רסק עגבניות, פלפל שחור, פפריקה מתוקה, עלה דפנה, מלח','לחמם תנור ל-160°C. לקלף את הבצל ולחתוך לפרוסות עבות, לקלף את הגזר ולחתוך ל-3–4 קטעים, לקלף את השום ולמעוך קלות עם סכין. | לחמם סיר כבד חסין תנור עם מכסה (בקוטר 18–20 ס״מ) על אש בינונית-גבוהה במשך 2 דקות. להוסיף שמן זית ולסובב לציפוי תחתית הסיר. | להניח את נתח השפונדרה בסיר ולצרוב 4–5 דקות עד השחמה עמוקה. להפוך בעזרת מלקחיים ולצרוב עוד 4–5 דקות עד השחמה דומה; אם התחתית משחימה מהר מדי, להוריד לאש בינונית. | להוסיף לסיר את הבצל, הגזר והשום מסביב לבשר ולבשל 2 דקות על אש בינונית תוך ערבוב קל של הירקות עד שהם מתחילים להתרכך ולהזהיב בקצוות. | להוסיף רסק עגבניות, פפריקה מתוקה ופלפל שחור ולערבב 30 שניות עד שהרסק מצפה את הירקות ומעלה ריח קלוי. להוסיף מלח ועלה דפנה. | למזוג מים לסיר ולגרד בעזרת כף עץ את המשקעים החומים מהתחתית עד שהנוזל מקבל צבע כהה. להביא לרתיחה קלה על אש בינונית (בועות קטנות בשוליים). | לכסות היטב ולהעביר לתנור. לבשל 2 שעות ו-45 דקות עד שהבשר רך מאוד ומזלג נכנס בקלות, והנוזל בסיר נראה סמיך מעט ומבריק. | להוציא מהתנור ולהעביר את הבשר לקרש. להשאיר את הסיר על אש בינונית ולצמצם את נ','[\"500 גרם\",\"1 כוס\",\"1 יח׳\",\"1 יח׳\",\"2 שיניים\",\"1 כף\",\"1 כף\",\"½ כפית\",\"1 כפית\",\"1 יח׳\",\"1 כפית\"]',1100,'אסאדו-בתנור-recipe.png','אסאדו בבישול ארוך בתנור עד לרכות, עם רוטב טבעי מצומצם ממיצי הבשר והירקות שבסיר.',7,0,13,5,1,21,'0','0','0','2','0','[]',205,'MID_LEVEL','Argentina'),(455,'Vanilla Milkshake','vanilla ice cream, whole milk, vanilla extract','Place a tall glass in the freezer for 5 minutes so the milkshake stays cold longer. | Add the vanilla ice cream, whole milk, and vanilla extract to a blender jar. | Blend on low speed for 10 seconds, then blend on high speed for 15–25 seconds, stopping once the mixture looks uniform, thick, and pourable with no visible ice cream lumps. | Pour immediately into the chilled glass; if it is too thick to pour, blend in 1 tablespoon more milk for 5 seconds and pour again.','[\"2 cups\",\"¾ cup\",\"¼ teaspoon\"]',650,'vanilla-milkshake-recipe.png','A classic blended drink made with vanilla ice cream and milk, finished with vanilla for a smooth, thick texture.',10,0,6,2,1,21,'0','0','0','0','0','[]',7,'EASY','United States');
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
  `imageName` varchar(90) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `imageName_UNIQUE` (`imageName`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (21,'Itzik','Templeman','itzik.templeman@gmail.com','005503cd6fa115604f3e4d1fda7c4ed430c548de1dfe599d5ba25236168a1cde748a9e48a4b04193d4dc1876576cce0ef1640ca9f412122d32b9ce3f096687ab','0545408531','MALE','1991-09-26','0a5a3809-4b25-44f3-b1fa-ffc9607535cd.png');
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

-- Dump completed on 2026-01-08 12:11:32
