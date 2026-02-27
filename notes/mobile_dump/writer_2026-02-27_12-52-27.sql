/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19-12.2.2-MariaDB, for Android (aarch64)
--
-- Host: localhost    Database: writer
-- ------------------------------------------------------
-- Server version	12.2.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `chapters`
--

DROP TABLE IF EXISTS `chapters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `chapters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` int(11) DEFAULT NULL,
  `name` varchar(50) DEFAULT NULL,
  `item_id` int(11) DEFAULT NULL,
  `Text` varchar(10000) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `chapters_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chapters`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `chapters` WRITE;
/*!40000 ALTER TABLE `chapters` DISABLE KEYS */;
INSERT INTO `chapters` VALUES
(7,1,'Chapter 1',3,'aaaa'),
(8,1,'Chapter 1',4,'aaaa bbbb'),
(10,1,'Chapter 1',6,'”My head hurts. The ringing noise keeps getting louder and louder. So loud, that I can\'t bare it anymore. This is when my eyes open. And suddenly, everything is quite. Neither a hush, nor a whisper. Is this all real? Can this even be real? Am I here, or is this just another dream? The hair on the back of my neck rise, and that is when I hear it. This is not a dream.”\nmain characters:\nRen: nerd, antisocial Peter: charismatic, sports, music James: extrovert, muscles Luna: honour student, can\'t swim Sebastian: traitor, average, Hashimoto\n*My head hurts. The ringing noise keeps getting louder and louder. So loud, that I can\'t bare it anymore. This is when my eyes open. And suddenly, everything is quite. Neither a hush, nor a whisper. Is this all real? Can this even be real? Am I here, or is this just another dream? The hair on the back of my neck rise, and that is when I hear it. This is not a dream.*\n*Crunch, snap*\n*I peek through the branches, trying , with only moonlight to rely on and that\'s when I see it... No, Him... Them!* *I turn around and run as fast as I can, my heart is almost in my throat, I want to vomit but my empty stomach grumbles, my legs, begging me to stop, but I can\'t...*\n----------------------------------------------------------------------------------------------------------------------------------------\nONE MONTH AGO\n\n8:30 AM\nAlmost empty seats, occasional chiming of the caffe bell, and in a corner, Ren, Early, silent, solving sudoku. Old habits die hard it seems. The cocoa cools down as number after number fills the grid.\nAnd then, a delicate chime, footsteps, too close to be a stranger, a light smell of Lily? Ren glanced at his wrist watch, 8:55 AM. He made a guess that the upper empty box will contain the number 8. He glanced up to confirm once, a small nod. No mistakes\n----------\nLuna nodded back, sipping her coffee. Her gaze drifted to his screen. \"I thought change was the only constant of the universe?\" Something he used to\nmumble in school. No reply, brows furrow a millimeter, another empty cell is filled.\nAnd then, a mumble, \"It is\"\n\n\n\n9:05 AM\nThe door opens with a bang\nRen sighs without looking at the door, putting some cotton balls in his ears as loud footsteps approach.\nAre those earplugs? Ouch.” Joseph pulled back a chair with far more volume than necessary and dropped\ninto it. Ren didn’t reply.\n“Wait a minute—” Joseph pointed between them. “You both arrived early… don’t tell me—”\n“You’re the one who’s late,” Luna cut him off. Joseph waved that away. “Five minutes is not a big deal.” “It is when you announce your arrival to the entire café.”\n“Presence,” Joseph corrected. “Noise,” Luna said.\n“Anyway—”, Joseph reached for Ren’s untouched cocoa.\nSmack!\nHis hand jerked back. That was the fastest Ren had moved all morning. Joseph blinked. “…Wow.” Luna didn’t look surprised. “You forgot he does that?”. Joseph: “I absolutely did.”\n------\nJoseph’s voice kept going. Ren let it run in the background while he fixed the uneven column.\nAlmost done. \"Ren\" he paused. \"Are you listening?\" Luna\'s voice pulled him out. He looked up, faintly resigned. \"Yes, I am\". Joseph perked up instantly.\n“Oh? Pop quiz. What were we talking about?” Ren exhaled quietly. “You were monologuing about traffic,” he said. Joseph made a face. Ren continued,\n“Luna said you should have left earlier”. Luna took a slow sip of her coffee, her gaze lingering briefly before she looked away. “Fair enough.”. *Was Ren always this attentive?* She asked herself.\nRen was already looking back at the grid. *Crisis averted.* He thought.\n\n9:32 AM\nJoseph was mid-sentence when the café door swung open. Ren exhaled softly. “…Late,” f he said. Joseph blinked. Luna’s gaze snapped towards the door. Peter strolled over, easy smile already in place. “Miss me?” Ren’s thumb moved again. “…Keep telling yourself that.” Joseph shot to his feet. “Who taught you to read clocks, dude you\'re half an hour late.” \"Pot calling kettle black\" Ren muttered, looking back at the screen. Luna’s attention lingered quietly on Ren. *…He could talk like that?* “Luna,” Peter greeted, dropping into the empty chair. No response.\n“Miss class representative?” Joseph teased, waving a hand in front of her. Luna blinked once and refocused. “Hi, Peter.” Peter’s grin widened. “There she is.” Luna took a slow sip, eyes drifting briefly back to Ren.\nRen placed the final number. The grid locked. He lifted his wrist. “Twenty-eight minutes for boarding.”\nRen stood and placed the now-cold cocoa into Peter’s hand. “No breakfast for you.” Peter blinked at the cup. “It’s cold.”. “You’re welcome.”. Ren was already walking. Joseph shot to his feet. “HEY—”. The café bell chimed.'),
(11,2,'Chapter 2',3,'9:55 AM \nJoseph finally steps on the deck, breathing heavily, \"I didn\'t know I would start hating crowds someday\" Peter adjusts his luggage as he moves to the now \"So, where\'s Ren?\" He asks Luna, standing cautiously away from the railing, \"In his room, he said there are too many people here\" she replies, slightly uneasy, eyes drifting across the railing, making mental notes of the floating tubes and clenching tight to the inner railing as the ship horns. Joseph copies Peter\'s pose on the bow, only for chaotic waves to greet him, making him clench harder. \"You ok?\", asks Peter, noticing his being a bit quieter than normal. \"Y-yeah, I just don\'t like waves\". Luna sighs, \"You suggested this\". \n\nThe ship starts moving, gradually gaining speed. The crowd on the deck thins out. \"Joseph, you sure you\'re alright?\" Peter asks, picking up his donut. Luna sits across them, reading something on her phone, occasionally glancing at the pool through the glass.\n\"Next time I suggest a ship, I want you two to hit me in the head\", \"Ok\", \"Done\", both reply in unison. \n\"I don\'t understand\" asks Luna, \"Aren\'t you-\" \"Joseph, is that you?\" A firm but strained voice calls from behind Peter. The trio turns towards the'),
(12,2,'Chapter 2',6,'The group moved with their luggage towards the bay with a towering 80 meters above the sea, Poseidon, the cruise with top speed 30 knots, on a 7 day round trip along East Caribbean.\n\"Now that I think about it, isn\'t this too extravagant?\", mumbled Peter. Joseph hung a hand over his shoulder, \"Hey man, we are meeting after 5 years, aren\'t we?  on, don\'t tell me it is hard on your pocket\" Peter continued walking, \"Its not. But still,.. Anyway, how are we supposed to get through this?\" He points at the absolute flood of people, families, bachelors swarming towards the ship. \"It\'s simple\" replies Luna with a smug grin, \"We have him\", pointing at Ren as if he\'s her Pokémon. \"Don\'t stay behind\", Ren says, picking up his and Luna\'s suitcases as he starts slipping through the gaps in the crowd, a skill every introvert picks up, it seems. Luna follows close behind, leaving Joseph dumbstruck. Peter picks up his own bag and tries to follow Luna, but the gaps already closed seconds ago.\n\n9:55 AM \nJoseph finally steps on the deck, breathing heavily, \"I didn\'t know I would start hating crowds someday\" Peter adjusts his luggage as he moves to the now \"So, where\'s Ren?\" He asks Luna, standing cautiously away from the railing, \"In his room, he said there are too many people here\" she replies, slightly uneasy, eyes drifting across the railing, making mental notes of the floating tubes and clenching tight to the inner railing as the ship horns. Joseph copies Peter\'s pose on the bow, only for chaotic waves to greet him, making him clench harder. \"You ok?\", asks Peter, noticing his being a bit quieter than normal. \"Y-yeah, I just don\'t like waves\". Luna sighs, \"You suggested this\". \n\nThe ship starts moving, gradually gaining speed. The crowd on the deck thins out. \"Joseph, you sure you\'re alright?\" Peter asks, picking up his donut. Luna sits across them, reading something on her phone, occasionally glancing at the pool through the glass.\n\"Next time I suggest a ship, I want you two to hit me in the head\", \"Ok\", \"Done\", both reply in unison. \n\"I don\'t understand\" asks Luna, \"Aren\'t you-\" \"Joseph, is that you?\" A firm but strained voice calls from behind Peter. The trio turns towards the voice to see a 6\'2 man in his mid 20s with broad but hunched shoulders and a face bluer than Joseph, followed by a younger girl in soft blue sundress and nobel demeanor.');
/*!40000 ALTER TABLE `chapters` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `comments`
--

DROP TABLE IF EXISTS `comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `item_id` (`item_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `comments_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comments`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `comments` WRITE;
/*!40000 ALTER TABLE `comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `comments` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Temporary table structure for view `item_with_chapter_count`
--

DROP TABLE IF EXISTS `item_with_chapter_count`;
/*!50001 DROP VIEW IF EXISTS `item_with_chapter_count`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `item_with_chapter_count` AS SELECT
 1 AS `item_id`,
  1 AS `name`,
  1 AS `review`,
  1 AS `author_id`,
  1 AS `number_of_chapters` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `items`
--

DROP TABLE IF EXISTS `items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) DEFAULT NULL,
  `author_id` int(11) DEFAULT NULL,
  `review` float DEFAULT NULL,
  `description` varchar(1000) DEFAULT NULL,
  `image_path` varchar(225) DEFAULT NULL,
  `type` char(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `author_id` (`author_id`),
  KEY `items_type` (`type`),
  CONSTRAINT `items_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `items` WRITE;
/*!40000 ALTER TABLE `items` DISABLE KEYS */;
INSERT INTO `items` VALUES
(3,'hello world',6,0,'multiperson test',NULL,'Novel'),
(4,'zoya',7,0,'test',NULL,'Novel'),
(6,'Litsoc',1,0,'litsoc week 1',NULL,'Novel');
/*!40000 ALTER TABLE `items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Temporary table structure for view `items_homepage_display`
--

DROP TABLE IF EXISTS `items_homepage_display`;
/*!50001 DROP VIEW IF EXISTS `items_homepage_display`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `items_homepage_display` AS SELECT
 1 AS `item_id`,
  1 AS `name`,
  1 AS `review`,
  1 AS `description`,
  1 AS `image_path`,
  1 AS `type`,
  1 AS `Number_of_chapters`,
  1 AS `author_id`,
  1 AS `author`,
  1 AS `email` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `likes`
--

DROP TABLE IF EXISTS `likes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`item_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `likes` WRITE;
/*!40000 ALTER TABLE `likes` DISABLE KEYS */;
/*!40000 ALTER TABLE `likes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `type`
--

DROP TABLE IF EXISTS `type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `type` (
  `name` char(10) NOT NULL,
  `key` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`key`),
  UNIQUE KEY `key_UNIQUE` (`key`),
  UNIQUE KEY `name_UNIQUE` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `type`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `type` WRITE;
/*!40000 ALTER TABLE `type` DISABLE KEYS */;
INSERT INTO `type` VALUES
('Novels',8),
('Poems',10),
('Stories',9);
/*!40000 ALTER TABLE `type` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `Name` varchar(80) DEFAULT NULL,
  `username` char(10) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username_UNIQUE` (`username`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(NULL,'owais','$2b$10$Ecy2iX2IvRaDJ5DWMBbcZu3kLd0JSjSLbswPPOdDwow6gTsZ2nBFm','owais@gmail.com',1),
(NULL,'Flinn','$2b$10$S9Iq8jTu2qKB8m/msLZ0v.ZnSUA3D.ZUv4giO0qRp0vZz8nuqPc9.','owaisshaikh376@gmail.com',3),
(NULL,'flinn1','$2b$10$doZGQzLP5NaDCY9d9VyL6.EHZz.p3u0GJMRQcaF7TBMNDha5XWBCu','owais@gmail.com',4),
(NULL,'owais1','$2b$10$LGd0m1zjfyaT7fhNSOsKUOUuz7ufbHVgNhDzmA7fJ5Z4vj0XvgfRe','owaisshaikh376@gmail.com',5),
('ow','aaaa','$2b$10$PA/9DF7XnYSVVhrQCepwt.PQDr4/zn1br0XnvlbpA0BALZvU6cXhu','aaaa@gmail.com',6),
('zoya','zoya1111','$2b$10$cJGxHkVBgvFqdCzlcFMLSOKJEnWQiNxuwXPMZItLG8.Z/Hz5a1X2O','zoyashaikh0015.id@gmail.com',7);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Final view structure for view `item_with_chapter_count`
--

/*!50001 DROP VIEW IF EXISTS `item_with_chapter_count`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `item_with_chapter_count` AS select `items`.`id` AS `item_id`,`items`.`name` AS `name`,`items`.`review` AS `review`,`items`.`author_id` AS `author_id`,count(`chapters`.`id`) AS `number_of_chapters` from (`items` left join `chapters` on(`chapters`.`item_id` = `items`.`id`)) group by `items`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `items_homepage_display`
--

/*!50001 DROP VIEW IF EXISTS `items_homepage_display`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `items_homepage_display` AS select `i`.`id` AS `item_id`,`i`.`name` AS `name`,`i`.`review` AS `review`,`i`.`description` AS `description`,`i`.`image_path` AS `image_path`,`i`.`type` AS `type`,(select count(0) from `chapters` `c` where `c`.`item_id` = `i`.`id`) AS `Number_of_chapters`,`u`.`id` AS `author_id`,`u`.`username` AS `author`,`u`.`email` AS `email` from (`items` `i` join `users` `u` on(`i`.`author_id` = `u`.`id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-02-27 12:52:32
