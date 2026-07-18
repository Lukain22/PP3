-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 18-07-2026 a las 00:13:52
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
  `priority` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `user_id` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category` varchar(100) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'incident',
  `sla_status` varchar(20) DEFAULT NULL,
  `sla_response_due` timestamp NULL DEFAULT NULL,
  `sla_resolution_due` timestamp NULL DEFAULT NULL,
  `sla_paused_at` timestamp NULL DEFAULT NULL,
  `group_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tickets`
--

INSERT INTO `tickets` (`id`, `title`, `description`, `status`, `priority`, `created_at`, `user_id`, `updated_at`, `category`, `subcategory`, `type`, `sla_status`, `sla_response_due`, `sla_resolution_due`, `sla_paused_at`, `group_id`) VALUES
(6, 'Contraseña no ingresa', 'Contraseña no ingresa', 'open', 'medium', '2026-06-19 03:10:04', 4, '2026-07-17 21:35:24', 'Red / Conectividad', 'VPN', 'incident', 'breached', '2026-06-19 10:10:04', '2026-06-20 06:10:04', NULL, 1),
(7, 'VPN error', '123 VPN error', 'in-progress', 'medium', '2026-06-19 03:18:03', 5, '2026-07-17 21:35:24', 'Red / Conectividad', 'VPN', 'incident', 'breached', '2026-06-19 10:18:03', '2026-06-20 06:18:03', NULL, 1),
(8, 'no tengo internet', 'se cortó de un memento a otro', 'open', 'high', '2026-06-19 06:02:43', 3, '2026-07-17 21:35:24', 'Red / Conectividad', 'Internet', 'incident', 'breached', '2026-06-19 11:02:43', '2026-06-19 17:02:43', NULL, 1),
(10, 'Error JIRA', 'Error JIRA', 'open', 'medium', '2026-06-19 07:06:26', 5, '2026-07-17 21:35:24', 'Software', 'Aplicaciones', 'incident', 'breached', '2026-06-19 14:06:26', '2026-06-20 10:06:26', NULL, 1),
(11, 'Error URL', 'Error URL', 'resolved', 'medium', '2026-06-20 04:06:52', 5, '2026-07-17 21:35:24', 'Otro', 'Otro', 'incident', 'breached', '2026-06-20 11:06:52', '2026-06-21 07:06:52', NULL, 1),
(12, 'Pedido de teclado', 'Pedido de teclado nuevo se rompio el anterior unu', 'open', NULL, '2026-06-22 02:47:40', 5, '2026-07-17 21:35:24', 'Hardware', 'Periféricos', 'requirement', NULL, NULL, NULL, NULL, 1),
(13, 'prueba', 'prueba', 'open', 'medium', '2026-06-22 14:35:15', 3, '2026-07-17 21:35:24', 'Software', 'Sistema operativo', 'incident', 'breached', '2026-06-22 21:35:15', '2026-06-23 17:35:15', NULL, 1),
(15, 'Funciona el envío de mail?', 'Funciona el envío de mail?', 'open', 'medium', '2026-06-22 23:36:40', 8, '2026-07-17 21:35:24', NULL, NULL, 'incident', 'breached', '2026-06-23 06:36:40', '2026-06-24 02:36:40', NULL, 1),
(16, 'No funca eso', 'No funca eso', 'on-hold', 'low', '2026-07-17 19:56:22', 3, '2026-07-17 21:51:16', 'Software', 'Otro', 'incident', 'paused', '2026-07-19 08:33:18', '2026-07-21 00:33:18', '2026-07-18 00:51:16', 2);

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
(1, 12, 5, 'updated', 'type', 'incident', 'requirement', '2026-06-23 00:01:32'),
(4, 16, 3, 'created', 'type', NULL, 'incident', '2026-07-17 19:56:22'),
(5, 16, 3, 'created', 'status', NULL, 'open', '2026-07-17 19:56:22'),
(6, 16, 3, 'created', 'title', NULL, 'No funca eso', '2026-07-17 19:56:22'),
(7, 16, 3, 'created', 'priority', NULL, 'medium', '2026-07-17 19:56:22'),
(8, 16, 5, 'updated', 'category', NULL, 'Software', '2026-07-17 19:57:18'),
(9, 16, 5, 'updated', 'sla_response_due', 'Fri Jul 17 2026 23:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-17 23:56:22', '2026-07-17 19:57:18'),
(10, 16, 5, 'updated', 'sla_resolution_due', 'Sat Jul 18 2026 19:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-18 19:56:22', '2026-07-17 19:57:18'),
(11, 16, 5, 'updated', 'subcategory', NULL, 'Otro', '2026-07-17 19:57:18'),
(12, 16, 5, 'updated', 'priority', 'medium', 'low', '2026-07-17 19:58:02'),
(13, 16, 5, 'updated', 'sla_response_due', 'Fri Jul 17 2026 23:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-18 03:56:22', '2026-07-17 19:58:02'),
(14, 16, 5, 'updated', 'sla_resolution_due', 'Sat Jul 18 2026 19:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-19 19:56:22', '2026-07-17 19:58:02'),
(15, 16, 5, 'updated', 'status', 'open', 'on-hold', '2026-07-17 20:04:49'),
(16, 16, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 03:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-18 06:56:22', '2026-07-17 20:04:49'),
(17, 16, 5, 'updated', 'sla_paused_at', NULL, '2026-07-17 20:04:49', '2026-07-17 20:04:49'),
(18, 16, 5, 'updated', 'sla_status', 'on_track', 'paused', '2026-07-17 20:04:49'),
(19, 16, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 19:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-19 22:56:22', '2026-07-17 20:04:49'),
(20, 16, 9, 'updated', 'status', 'on-hold', 'resolved', '2026-07-17 21:41:45'),
(21, 16, 9, 'updated', 'sla_response_due', 'Sat Jul 18 2026 06:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-18 08:33:18', '2026-07-17 21:41:45'),
(22, 16, 9, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 22:56:22 GMT-0300 (hora estándar de Argentina)', '2026-07-20 00:33:18', '2026-07-17 21:41:45'),
(23, 16, 9, 'updated', 'sla_paused_at', 'Fri Jul 17 2026 20:04:49 GMT-0300 (hora estándar de Argentina)', NULL, '2026-07-17 21:41:45'),
(24, 16, 9, 'updated', 'sla_status', 'paused', 'met', '2026-07-17 21:41:45'),
(25, 16, 9, 'updated', 'status', 'resolved', 'open', '2026-07-17 21:41:56'),
(26, 16, 9, 'updated', 'sla_response_due', 'Sat Jul 18 2026 08:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-18 11:33:18', '2026-07-17 21:41:56'),
(27, 16, 9, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 00:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-20 03:33:18', '2026-07-17 21:41:56'),
(28, 16, 9, 'updated', 'sla_status', 'met', 'on_track', '2026-07-17 21:41:56'),
(29, 16, 9, 'updated', 'status', 'open', 'resolved', '2026-07-17 21:42:02'),
(30, 16, 5, 'updated', 'group_id', '1', '2', '2026-07-17 21:45:37'),
(31, 16, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 20:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-18 23:33:18', '2026-07-17 21:45:37'),
(32, 16, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 12:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-20 15:33:18', '2026-07-17 21:45:37'),
(33, 16, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 23:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-19 02:33:18', '2026-07-17 21:45:44'),
(34, 16, 5, 'updated', 'status', 'resolved', 'in-progress', '2026-07-17 21:45:44'),
(35, 16, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 15:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-20 18:33:18', '2026-07-17 21:45:44'),
(36, 16, 5, 'updated', 'sla_status', 'met', 'on_track', '2026-07-17 21:45:44'),
(37, 16, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 18:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-20 21:33:18', '2026-07-17 21:51:16'),
(38, 16, 5, 'updated', 'status', 'in-progress', 'on-hold', '2026-07-17 21:51:16'),
(39, 16, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 02:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-19 05:33:18', '2026-07-17 21:51:16'),
(40, 16, 5, 'updated', 'sla_status', 'on_track', 'paused', '2026-07-17 21:51:16'),
(41, 16, 5, 'updated', 'sla_paused_at', NULL, '2026-07-17 21:51:16', '2026-07-17 21:51:16');

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
(3, 'luciano@gmail.com', '$2b$10$ZxyaDUmM75lzC04FpIZ5UefMsZeKczTywQvXsMUPhN6iAdmfHDU/i', '2026-06-05 04:11:58', 'technician'),
(4, 'x@x.com', '$2b$10$6c7/QKAyQ8Z1vo/XToMx5ujxfCjNYkw8xI1uuRmSMGniqgAJ2wKee', '2026-06-19 01:46:48', 'user'),
(5, 'admin@g.com', '$2b$10$Szn7n4Uepg9fBlZqa7OiFORnmt5RmGa8gSu79nmqb23SjncqG1dzm', '2026-06-19 03:00:12', 'admin'),
(7, 'paola@p.com', '$2b$10$PGxD.g.dqjppUiWQZzwnhO8jijcKSzd1VXxzNC5H126GLGzxoeFb2', '2026-06-22 23:08:54', 'user'),
(8, 'ltarizzo91@gmail.com', '$2b$10$UFKpZLhWlfQlaMQM2N25leLZjKNH6zhRUML08dvnGGL7a8kUzkzl2', '2026-06-22 23:36:18', 'user'),
(9, 'lucho@g.com', '$2b$10$unwFMOiyYKWA4NdHW4zfp.i8E4U9jeiR4HKwmxFgt0qzt.Nx9UFmi', '2026-07-17 19:18:40', 'technician');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `ticket_comments`
--
ALTER TABLE `ticket_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de la tabla `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

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
