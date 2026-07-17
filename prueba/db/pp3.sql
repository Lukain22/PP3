-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 17-07-2026 a las 19:00:47
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pp3`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'open',
  `priority` varchar(50) NOT NULL DEFAULT 'medium',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category` varchar(100) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'incident'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tickets`
--

INSERT INTO `tickets` (`id`, `title`, `description`, `status`, `priority`, `created_at`, `user_id`, `updated_at`, `category`, `subcategory`, `type`) VALUES
(6, 'Contraseña no ingresa', 'Contraseña no ingresa', 'open', 'medium', '2026-06-19 03:10:04', 4, '2026-06-19 06:37:39', 'Red / Conectividad', 'VPN', 'incident'),
(7, 'VPN error', '123 VPN error', 'in-progress', 'medium', '2026-06-19 03:18:03', 5, '2026-06-19 07:05:37', 'Red / Conectividad', 'VPN', 'incident'),
(8, 'no tengo internet', 'se cortó de un memento a otro', 'open', 'high', '2026-06-19 06:02:43', 3, '2026-06-19 07:07:23', 'Red / Conectividad', 'Internet', 'incident'),
(10, 'Error JIRA', 'Error JIRA', 'open', 'medium', '2026-06-19 07:06:26', 5, '2026-06-19 07:07:33', 'Software', 'Aplicaciones', 'incident'),
(11, 'Error URL', 'Error URL', 'resolved', 'medium', '2026-06-20 04:06:52', 5, '2026-06-22 03:00:20', 'Otro', 'Otro', 'incident'),
(12, 'Pedido de teclado', 'Pedido de teclado nuevo se rompio el anterior unu', 'open', 'medium', '2026-06-22 02:47:40', 5, '2026-06-23 00:01:32', 'Hardware', 'Periféricos', 'requirement'),
(13, 'prueba', 'prueba', 'open', 'medium', '2026-06-22 14:35:15', 3, '2026-06-22 23:27:42', 'Software', 'Sistema operativo', 'incident'),
(15, 'Funciona el envío de mail?', 'Funciona el envío de mail?', 'open', 'medium', '2026-06-22 23:36:40', 8, '2026-06-22 23:36:40', NULL, NULL, 'incident');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_comments`
--

CREATE TABLE `ticket_comments` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_comments`
--

INSERT INTO `ticket_comments` (`id`, `ticket_id`, `user_id`, `content`, `created_at`) VALUES
(10, 7, 5, 'en progrso', '2026-06-19 03:18:31'),
(15, 8, 3, 'dsadsadsad', '2026-06-19 06:07:53'),
(16, 10, 5, 'visto', '2026-06-19 07:06:58'),
(17, 13, 3, 'fjshsudshdfhfhd', '2026-06-22 14:35:29'),
(19, 15, 5, 'fewfsdfsd', '2026-07-17 16:06:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_history`
--

CREATE TABLE `ticket_history` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `action` varchar(50) NOT NULL DEFAULT 'updated',
  `field_name` varchar(50) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_history`
--

INSERT INTO `ticket_history` (`id`, `ticket_id`, `user_id`, `action`, `field_name`, `old_value`, `new_value`, `created_at`) VALUES
(1, 12, 5, 'updated', 'type', 'incident', 'requirement', '2026-06-23 00:01:32');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` varchar(20) NOT NULL DEFAULT 'user'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `created_at`, `role`) VALUES
(1, 'test@ejemplo.com', '$2b$10$JH77Okg10uvtRglIkr3m4ekemectz73AbrzK60heFFXdFs4Advkv2', '2026-06-05 04:08:05', 'user'),
(2, 'test2@ejemplo.com', '$2b$10$VgUX5Lirs.1oYkwzZQFkKue3ZtB6DsulLCj8G6EaK0zhomhKrDBZm', '2026-06-05 04:08:14', 'user'),
(3, 'luciano@gmail.com', '$2b$10$ZxyaDUmM75lzC04FpIZ5UefMsZeKczTywQvXsMUPhN6iAdmfHDU/i', '2026-06-05 04:11:58', 'user'),
(4, 'x@x.com', '$2b$10$6c7/QKAyQ8Z1vo/XToMx5ujxfCjNYkw8xI1uuRmSMGniqgAJ2wKee', '2026-06-19 01:46:48', 'user'),
(5, 'admin@g.com', '$2b$10$Szn7n4Uepg9fBlZqa7OiFORnmt5RmGa8gSu79nmqb23SjncqG1dzm', '2026-06-19 03:00:12', 'admin'),
(7, 'paola@p.com', '$2b$10$PGxD.g.dqjppUiWQZzwnhO8jijcKSzd1VXxzNC5H126GLGzxoeFb2', '2026-06-22 23:08:54', 'user'),
(8, 'ltarizzo91@gmail.com', '$2b$10$UFKpZLhWlfQlaMQM2N25leLZjKNH6zhRUML08dvnGGL7a8kUzkzl2', '2026-06-22 23:36:18', 'user');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `ticket_comments`
--
ALTER TABLE `ticket_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de la tabla `ticket_comments`
--
ALTER TABLE `ticket_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `ticket_comments`
--
ALTER TABLE `ticket_comments`
  ADD CONSTRAINT `ticket_comments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `ticket_history`
--
ALTER TABLE `ticket_history`
  ADD CONSTRAINT `ticket_history_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_history_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
