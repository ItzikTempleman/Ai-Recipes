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
  `usrId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `imageName_UNIQUE` (`imageName`),
  KEY `recipeToUser_idx` (`usrId`),
  CONSTRAINT `recipeToUser` FOREIGN KEY (`usrId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--

LOCK TABLES `recipe` WRITE;
/*!40000 ALTER TABLE `recipe` DISABLE KEYS */;
INSERT INTO `recipe` VALUES (152,'סטייק אנטריקוט','אנטריקוט, מלח, פפריקה, שום קצוץ, שמן זית','חממים מחבת על חום גבוה. | מניחים את הסטייק במחבת עם שמן זית. | מתבלים במלח, פפריקה ושום. | שורים את הסטייק במשך 3-4 דקות מכל צד או עד שהסטייק מגיע לרמת הצלייה הרצויה. | מניחים לנוח מספר דקות לפני ההגשה.','[\"200 גרם\",\"לפי הטעם\",\"לפי הטעם\",\"1 שן\",\"1 כף\"]',500,NULL,'סטייק אנטריקוט הוא נתח בשר שמקורו בצד הכליתי של הפרה, בעל טעמים עשירים ומרקם רך.',8,0,26,6,1,NULL),(153,'קובה כחול עם זעתר וסלט גזר חמוץ','סולת, קמח, בשר טחון, סודה לשתיה, מלח, מים, זעתר, גזר, חומץ, סוכר, שום','מניחים את הסולת, הקמח, סודה לשתיה, ומלח בקערה ומערבבים. | מוסיפים מים עד שהבצק מתאחד ומניחים לו לנוח 30 דקות. | לטגן את הבשר עם שום עד שהוא מבושל, ותבל במלח לפי הטעם. | מרדדים את הבצק יוצרים לו צורת כדורים וממלאים בבשר המטוגן. | מבשלים את הקובות במים רותחים למשך 20 דקות. | מגרדים את הגזר ומערבבים עם חומץ, סוכר ומלח. | מגישים את הקובות לצד הזעתר וסלט הגזר החמוץ.','[\"1 כוס\",\"1/2 כוס\",\"200 גרם\",\"1 כפית\",\"לפי הטעם\",\"1/2 כוס\",\"לפי הטעם\",\"1\",\"2 כפות\",\"1 כפית\",\"1 שן\"]',450,NULL,'קובה כחול הוא מאכל מזרח תיכוני קלאסי, עשוי מעור של קמח וסולת וממולא בתערובת בשר, המוגש עם זעתר וסלט גזר חמוץ.',7,5,18,7,1,NULL);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
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

-- Dump completed on 2025-11-21  9:59:36
