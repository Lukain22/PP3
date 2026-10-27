-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-10-2026 a las 22:57:50
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
-- Estructura de tabla para la tabla `groups`
--

CREATE TABLE `groups` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `groups`
--

INSERT INTO `groups` (`id`, `name`, `description`, `is_default`, `created_at`) VALUES
(1, 'Mesa de entrada', 'Grupo principal donde ingresan los tickets nuevos para derivación', 1, '2026-07-17 21:28:53'),
(2, 'Soporte Técnico', 'Nivel 1', 0, '2026-07-17 21:44:46'),
(3, 'Redes', NULL, 0, '2026-07-18 09:07:55'),
(4, 'Servidores', NULL, 0, '2026-07-18 09:09:19'),
(5, 'Diseño grafico', NULL, 0, '2026-07-20 02:37:26'),
(6, 'Base de Datos', NULL, 0, '2026-10-15 18:50:55'),
(7, 'Seguridad Informática', NULL, 0, '2026-10-15 18:51:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `actor_user_id` int(11) DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `ticket_id`, `type`, `title`, `message`, `actor_user_id`, `read_at`, `created_at`) VALUES
(1, 12, 26, 'ticket_updated', 'Actualización en \"Phishing perdi el aguinaldo\"', 'Cambió el grupo del ticket', 5, '2026-07-18 20:28:16', '2026-07-18 20:24:35'),
(2, 12, 26, 'ticket_updated', 'Actualización en \"Phishing perdi el aguinaldo\"', 'Se asignó un técnico', 5, '2026-07-18 20:28:14', '2026-07-18 20:24:38'),
(3, 12, 26, 'new_comment', 'Nuevo comentario en \"Phishing perdi el aguinaldo\"', 'El equipo de soporte dejó una nota en tu solicitud.', 13, '2026-07-18 20:28:12', '2026-07-18 20:25:09'),
(4, 13, 26, 'new_comment', 'Nuevo comentario en \"Phishing perdi el aguinaldo\"', 'El solicitante dejó una nota en el ticket.', 12, '2026-07-18 20:33:50', '2026-07-18 20:33:36'),
(7, 12, 24, 'ticket_updated', 'Actualización en \"No funciona equipo Meraki\"', 'Estado: Abierto → En proceso', 5, NULL, '2026-07-20 02:45:28'),
(8, 12, 24, 'ticket_updated', 'Actualización en \"No funciona equipo Meraki\"', 'Estado: En proceso → En espera', 5, NULL, '2026-07-20 02:45:32'),
(9, 12, 24, 'ticket_updated', 'Actualización en \"No funciona equipo Meraki\"', 'Estado: En espera → Resuelto', 5, NULL, '2026-07-20 02:45:37'),
(10, 12, 24, 'new_comment', 'Nuevo comentario en \"No funciona equipo Meraki\"', 'El equipo de soporte dejó una nota en tu solicitud.', 5, NULL, '2026-07-20 02:46:27'),
(11, 12, 24, 'new_comment', 'Nuevo comentario en \"No funciona equipo Meraki\"', 'El equipo de soporte dejó una nota en tu solicitud.', 5, NULL, '2026-07-20 02:46:41'),
(12, 12, 24, 'ticket_updated', 'Actualización en \"No funciona equipo Meraki\"', 'Se asignó un técnico', 5, NULL, '2026-07-20 02:47:26'),
(13, 12, 26, 'resolution_added', 'Ticket resuelto: \"Phishing perdi el aguinaldo\"', 'Tu solicitud fue marcada como resuelta.', 5, NULL, '2026-07-20 02:49:24'),
(14, 12, 26, 'ticket_updated', 'Actualización en \"Phishing perdi el aguinaldo\"', 'Estado: Resuelto → Abierto', 5, NULL, '2026-07-20 02:49:43'),
(15, 12, 26, 'resolution_added', 'Ticket resuelto: \"Phishing perdi el aguinaldo\"', 'Tu solicitud fue marcada como resuelta.', 13, NULL, '2026-07-20 02:57:29'),
(16, 11, 21, 'new_comment', 'Nuevo comentario en \"ea\"', 'El equipo de soporte dejó una nota en tu solicitud.', 5, NULL, '2026-09-14 13:42:33'),
(17, 5, 28, 'new_comment', 'Nuevo comentario en \"Prueba\"', 'El equipo de soporte dejó una nota en tu solicitud.', 13, '2026-10-02 21:44:50', '2026-10-02 20:10:05'),
(18, 5, 28, 'resolution_added', 'Ticket resuelto: \"Prueba\"', 'Tu solicitud fue marcada como resuelta.', 13, '2026-10-02 21:44:50', '2026-10-02 20:10:45'),
(19, 5, 28, 'ticket_updated', 'Actualización en \"Prueba\"', 'Estado: Resuelto → Abierto', 13, '2026-10-02 21:44:50', '2026-10-02 20:10:47'),
(20, 5, 28, 'resolution_added', 'Ticket resuelto: \"Prueba\"', 'Tu solicitud fue marcada como resuelta.', 13, '2026-10-07 03:13:36', '2026-10-07 00:26:04'),
(21, 5, 29, 'ticket_updated', 'Actualización en \"123123123\"', 'Estado: Abierto → Resuelto', 13, '2026-10-09 06:30:58', '2026-10-07 03:20:07'),
(24, 5, 33, 'ticket_updated', 'Actualización en \"WDW\"', 'Estado: Abierto → Resuelto', 13, '2026-10-09 06:30:58', '2026-10-08 22:45:00'),
(25, 13, 34, 'ticket_updated', 'Actualización en \"444\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:04:06'),
(26, 13, 34, 'ticket_updated', 'Actualización en \"444\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:05:27'),
(27, 13, 34, 'ticket_updated', 'Actualización en \"444\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:05:29'),
(28, 13, 34, 'ticket_updated', 'Actualización en \"444\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:05:32'),
(29, 13, 34, 'ticket_updated', 'Actualización en \"444\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:05:42'),
(30, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:01'),
(31, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:11'),
(32, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:18'),
(33, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:23'),
(34, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:28'),
(35, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:32'),
(36, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:40'),
(37, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 04:06:41'),
(39, 5, 31, 'ticket_updated', 'Actualización en \"Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Prueb', 'Cambió el grupo del ticket', 13, '2026-10-09 06:30:58', '2026-10-09 04:11:37'),
(40, 5, 29, 'ticket_updated', 'Actualización en \"123123123\"', 'Cambió el grupo del ticket', 13, '2026-10-09 06:30:58', '2026-10-09 04:11:45'),
(41, 5, 30, 'ticket_updated', 'Actualización en \"666\"', 'Cambió el grupo del ticket', 21, '2026-10-09 06:30:58', '2026-10-09 04:19:48'),
(42, 5, 28, 'ticket_updated', 'Actualización en \"Prueba\"', 'Cambió el grupo del ticket', 21, '2026-10-09 06:30:58', '2026-10-09 04:19:57'),
(43, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Cambió el grupo del ticket', 21, NULL, '2026-10-09 04:21:12'),
(45, 11, 21, 'ticket_updated', 'Actualización en \"ea\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-09 05:22:38'),
(47, 5, 37, 'resolution_added', 'Ticket resuelto: \"FFFFF\"', 'Tu solicitud fue marcada como resuelta.', 13, '2026-10-16 17:07:00', '2026-10-09 16:01:33'),
(48, 5, 37, 'ticket_updated', 'Actualización en \"FFFFF\"', 'Estado: Resuelto → Abierto', 13, '2026-10-16 17:07:00', '2026-10-09 16:04:01'),
(49, 12, 36, 'resolution_added', 'Ticket resuelto: \"PRUEBA CAMPO DESCRIPCION\"', 'Tu solicitud fue marcada como resuelta.', 5, NULL, '2026-10-15 18:40:22'),
(50, 12, 36, 'ticket_updated', 'Actualización en \"PRUEBA CAMPO DESCRIPCION\"', 'Estado: Resuelto → Abierto', 5, NULL, '2026-10-15 18:40:30'),
(51, 24, 39, 'ticket_updated', 'Actualización en \"Prueba ticket usuario VISTA\"', 'Estado: Abierto → Resuelto', 5, NULL, '2026-10-22 03:15:48'),
(52, 12, 36, 'new_comment', 'Nuevo comentario en \"PRUEBA CAMPO DESCRIPCION\"', 'El equipo de soporte dejó una nota en tu solicitud.', 5, NULL, '2026-10-22 03:38:00'),
(53, 12, 36, 'new_comment', 'Nuevo comentario en \"PRUEBA CAMPO DESCRIPCION\"', 'El equipo de soporte dejó una nota en tu solicitud.', 5, NULL, '2026-10-22 03:38:06'),
(57, 16, 45, 'resolution_added', 'Ticket resuelto: \"Formateo notebook\"', 'Tu solicitud fue marcada como resuelta.', 5, NULL, '2026-10-23 03:59:20'),
(58, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Se asignó un técnico', 5, NULL, '2026-10-23 04:42:23'),
(59, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Prioridad: — → Media · Tipo: Requerimiento → Incidente', 5, NULL, '2026-10-23 04:42:43'),
(60, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Se quitó la asignación del técnico', 5, NULL, '2026-10-23 04:43:48'),
(61, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Estado: Resuelto → Abierto', 5, NULL, '2026-10-23 04:43:59'),
(62, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Estado: Abierto → En espera', 5, NULL, '2026-10-23 04:44:06'),
(63, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Estado: En espera → En proceso', 5, NULL, '2026-10-23 18:55:03'),
(64, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Prioridad: Media → Baja', 5, NULL, '2026-10-23 18:55:19'),
(65, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Prioridad: Baja → Alta', 5, NULL, '2026-10-23 18:55:24'),
(66, 16, 42, 'new_comment', 'Nuevo comentario en \"Corte de Fibra Optica por poda\"', 'El equipo de soporte dejó una nota en tu solicitud.', 5, NULL, '2026-10-23 19:33:45'),
(67, 16, 46, 'ticket_updated', 'Actualización en \"Aumento almacenamiento de VM\"', 'Se asignó un técnico', 5, NULL, '2026-10-23 21:03:20'),
(68, 16, 43, 'ticket_updated', 'Actualización en \"Problemas repositorio HML\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-23 21:05:06'),
(69, 16, 41, 'ticket_updated', 'Actualización en \"Grant en BBDD\"', 'Cambió el grupo del ticket', 5, NULL, '2026-10-23 21:09:43'),
(70, 4, 19, 'ticket_updated', 'Actualización en \"Backbone caido\"', 'Se quitó la asignación del técnico · Cambió el grupo del ticket', 5, NULL, '2026-10-23 21:09:53'),
(71, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Prioridad: Alta → Baja', 5, NULL, '2026-10-23 21:21:39'),
(72, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Estado: En proceso → En espera', 5, NULL, '2026-10-23 21:21:47'),
(73, 16, 44, 'ticket_updated', 'Actualización en \"Acceso carpeta compartida \"', 'Prioridad: Media → — · Tipo: Incidente → Requerimiento', 5, NULL, '2026-10-23 21:24:30'),
(74, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Prioridad: Baja → — · Tipo: Incidente → Requerimiento', 5, NULL, '2026-10-23 21:24:39'),
(75, 16, 46, 'ticket_updated', 'Actualización en \"Aumento almacenamiento de VM\"', 'Prioridad: Media → — · Tipo: Incidente → Requerimiento', 5, NULL, '2026-10-23 21:24:51'),
(76, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Se asignó un técnico', 13, NULL, '2026-10-23 21:27:30'),
(77, 16, 40, 'ticket_updated', 'Actualización en \"Problemas con DNS\"', 'Cambió el grupo del ticket', 13, NULL, '2026-10-23 21:27:56'),
(78, 5, 7, 'ticket_updated', 'Actualización en \"VPN error\"', 'Cambió el grupo del ticket', 20, '2026-10-26 06:02:50', '2026-10-23 21:28:56'),
(79, 16, 40, 'ticket_updated', 'Actualización en \"Problemas con DNS\"', 'Se asignó un técnico', 20, NULL, '2026-10-23 21:38:34'),
(80, 16, 40, 'resolution_added', 'Ticket resuelto: \"Problemas con DNS\"', 'Tu solicitud fue marcada como resuelta.', 20, NULL, '2026-10-23 21:38:55'),
(81, 16, 40, 'ticket_updated', 'Actualización en \"Problemas con DNS\"', 'Estado: Resuelto → Abierto', 20, NULL, '2026-10-23 21:39:07'),
(82, 16, 45, 'ticket_updated', 'Actualización en \"Formateo notebook\"', 'Se quitó la asignación del técnico · Cambió el grupo del ticket', 13, NULL, '2026-10-26 03:35:23'),
(83, 16, 44, 'ticket_updated', 'Actualización en \"Acceso carpeta compartida\"', 'Estado: Abierto → En proceso', 5, NULL, '2026-10-26 03:37:18'),
(84, 16, 42, 'ticket_updated', 'Actualización en \"Corte de Fibra Optica por poda\"', 'Estado: Abierto → En espera', 5, NULL, '2026-10-26 03:37:22'),
(85, 16, 44, 'ticket_updated', 'Actualización en \"Acceso carpeta compartida\"', 'Se asignó un técnico', 5, NULL, '2026-10-26 03:39:27'),
(86, 16, 44, 'resolution_added', 'Ticket resuelto: \"Acceso carpeta compartida\"', 'Tu solicitud fue marcada como resuelta.', 5, NULL, '2026-10-26 03:39:27'),
(87, 16, 44, 'ticket_updated', 'Actualización en \"Acceso carpeta compartida\"', 'Estado: Resuelto → Abierto', 5, NULL, '2026-10-26 03:39:41'),
(88, 12, 25, 'ticket_updated', 'Actualización en \"Pedido acceso HML\"', 'Se asignó un técnico', 27, NULL, '2026-10-26 06:07:32'),
(89, 12, 50, 'ticket_updated', 'Actualización en \"No me abre el correo\"', 'Estado: Abierto → En espera', 5, NULL, '2026-10-27 01:10:11'),
(90, 16, 43, 'ticket_updated', 'Actualización en \"Problemas repositorio HML\"', 'Estado: Abierto → En espera', 5, NULL, '2026-10-27 01:10:15');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`) VALUES
(1, 16, 'a4f9bfd52bc6f6d1975f44cf62433c0f9ee279637ad9bb2e7962ff43f0577ef9', '2026-09-25 20:01:26', NULL, '2026-09-25 22:01:26'),
(2, 8, '1bcede3430aaefe025faea94d3c8eb2f2d110394b4c0358bb00ad120e86d50fc', '2026-10-16 13:57:25', '2026-10-16 13:28:00', '2026-10-16 16:27:25'),
(3, 8, '66c1735af6141a3d31898f59a8a0e86e3ef0c08902c44dcec602826adca6e4be', '2026-10-19 13:06:23', NULL, '2026-10-19 15:36:23'),
(4, 28, '0ca3b6d50f4248d00831bb4d6b5de96afa2e212811d7c79d9b784ff242441d62', '2026-10-26 16:38:26', NULL, '2026-10-26 19:08:26');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permissions`
--

CREATE TABLE `permissions` (
  `id` int(11) NOT NULL,
  `code` varchar(64) NOT NULL,
  `module` varchar(64) NOT NULL,
  `name` varchar(120) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `supports_scope` tinyint(1) NOT NULL DEFAULT 0,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permissions`
--

INSERT INTO `permissions` (`id`, `code`, `module`, `name`, `description`, `supports_scope`, `sort_order`) VALUES
(1, 'tickets.view', 'tickets', 'Ver tickets', 'Ver la cola y el detalle de tickets fuera de los propios. El alcance indica de qué grupos.', 1, 10),
(2, 'tickets.create', 'tickets', 'Crear tickets', 'Abrir una solicitud nueva', 0, 20),
(3, 'tickets.edit', 'tickets', 'Editar tickets', 'Modificar datos y el estado operativo del ticket', 0, 30),
(4, 'tickets.delete', 'tickets', 'Eliminar tickets', 'Borrar tickets', 0, 40),
(5, 'tickets.resolve', 'tickets', 'Resolver tickets', 'Registrar la resolución y pasar el ticket a resuelto', 0, 50),
(6, 'tickets.reopen', 'tickets', 'Reabrir tickets', 'Volver a abrir un ticket resuelto', 0, 60),
(7, 'tickets.close', 'tickets', 'Cerrar tickets', 'Cerrar tickets de forma definitiva', 0, 70),
(8, 'tickets.comment', 'tickets', 'Comentar tickets', 'Agregar comentarios', 0, 80),
(9, 'tickets.attach', 'tickets', 'Adjuntar archivos', 'Subir archivos al ticket', 0, 90),
(10, 'assignments.transfer', 'assignments', 'Derivar tickets', 'Cambiar el grupo del ticket. El alcance indica a qué grupos.', 1, 10),
(11, 'assignments.self', 'assignments', 'Autoasignarse tickets', 'Tomar un ticket para sí mismo', 0, 20),
(12, 'assignments.others', 'assignments', 'Asignar tickets a otros', 'Asignar o quitar el técnico de un ticket', 0, 30),
(13, 'admin.access', 'admin', 'Acceder al panel', 'Entrar al panel de administración', 0, 10),
(14, 'admin.users', 'admin', 'Gestionar usuarios', 'Ver y actualizar usuarios', 0, 20),
(15, 'admin.groups', 'admin', 'Gestionar grupos', 'Administrar grupos de resolución', 0, 30),
(16, 'admin.categories', 'admin', 'Gestionar categorías', 'Administrar categorías de tickets', 0, 40),
(17, 'admin.subcategories', 'admin', 'Gestionar subcategorías', 'Administrar subcategorías de tickets', 0, 50),
(18, 'admin.roles', 'admin', 'Gestionar roles', 'Crear y asignar roles y permisos', 0, 60),
(19, 'admin.settings', 'admin', 'Gestionar configuración', 'Cambiar la configuración general, incluido el SLA', 0, 70),
(20, 'kb.create', 'kb', 'Crear soluciones', 'Crear artículos de la base de conocimiento', 0, 10),
(21, 'kb.edit', 'kb', 'Editar soluciones', 'Editar artículos', 0, 20),
(22, 'kb.delete', 'kb', 'Eliminar soluciones', 'Eliminar artículos', 0, 30),
(23, 'kb.publish', 'kb', 'Publicar soluciones', 'Publicar artículos', 0, 40),
(24, 'kb.approve', 'kb', 'Aprobar soluciones', 'Aprobar artículos antes de publicarlos', 0, 50),
(25, 'reports.view', 'reports', 'Ver reportes', 'Consultar reportes', 0, 10),
(26, 'reports.export', 'reports', 'Exportar reportes', 'Exportar reportes', 0, 20),
(27, 'views.create', 'views', 'Crear vistas', 'Crear vistas guardadas de tickets', 0, 10),
(28, 'views.edit', 'views', 'Editar vistas', 'Modificar vistas propias', 0, 20),
(29, 'views.share', 'views', 'Compartir vistas', 'Compartir una vista con un grupo', 0, 30);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(80) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_system` tinyint(1) NOT NULL DEFAULT 0,
  `parent_role_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `code`, `name`, `description`, `is_active`, `is_system`, `parent_role_id`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'administrador', 'Administrador', 'Acceso total al sistema. Los permisos de este rol se mantienen alineados al catálogo.', 1, 1, NULL, NULL, '2026-10-08 04:48:14', '2026-10-08 04:48:14'),
(2, 'supervisor', 'Supervisor', 'Opera tickets y puede derivarlos a cualquier grupo.', 1, 1, NULL, NULL, '2026-10-08 04:48:15', '2026-10-08 04:48:15'),
(3, 'operador', 'Operador', 'Resuelve, comenta y deriva tickets. El alcance de derivación se puede restringir por grupo.', 1, 1, NULL, NULL, '2026-10-08 04:48:15', '2026-10-08 04:48:15'),
(4, 'solicitante', 'Solicitante', 'Crea solicitudes, comenta y adjunta archivos en sus propios tickets.', 1, 1, NULL, NULL, '2026-10-08 04:48:15', '2026-10-08 04:48:15'),
(15, 'copia-de-operador', 'Tecnico MDA', 'Tecnico MDA. Resuelve, comenta y deriva tickets.', 1, 0, NULL, 5, '2026-10-08 17:30:46', '2026-10-08 17:37:07'),
(199, 'espectador-sistema', 'Espectador del sistema', 'Ve tickets y las vistas compartidas según el alcance de grupos, sin modificarlos. Duplicá el rol para autorizar distintos grupos.', 1, 1, NULL, NULL, '2026-10-26 20:37:04', '2026-10-26 20:37:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_permissions`
--

CREATE TABLE `role_permissions` (
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `role_permissions`
--

INSERT INTO `role_permissions` (`role_id`, `permission_id`, `valid_from`, `valid_until`) VALUES
(1, 1, NULL, NULL),
(1, 2, NULL, NULL),
(1, 3, NULL, NULL),
(1, 4, NULL, NULL),
(1, 5, NULL, NULL),
(1, 6, NULL, NULL),
(1, 7, NULL, NULL),
(1, 8, NULL, NULL),
(1, 9, NULL, NULL),
(1, 10, NULL, NULL),
(1, 11, NULL, NULL),
(1, 12, NULL, NULL),
(1, 13, NULL, NULL),
(1, 14, NULL, NULL),
(1, 15, NULL, NULL),
(1, 16, NULL, NULL),
(1, 17, NULL, NULL),
(1, 18, NULL, NULL),
(1, 19, NULL, NULL),
(1, 20, NULL, NULL),
(1, 21, NULL, NULL),
(1, 22, NULL, NULL),
(1, 23, NULL, NULL),
(1, 24, NULL, NULL),
(1, 25, NULL, NULL),
(1, 26, NULL, NULL),
(1, 27, NULL, NULL),
(1, 28, NULL, NULL),
(1, 29, NULL, NULL),
(2, 1, NULL, NULL),
(2, 3, NULL, NULL),
(2, 5, NULL, NULL),
(2, 6, NULL, NULL),
(2, 8, NULL, NULL),
(2, 9, NULL, NULL),
(2, 10, NULL, NULL),
(2, 11, NULL, NULL),
(2, 12, NULL, NULL),
(2, 25, NULL, NULL),
(2, 26, NULL, NULL),
(2, 27, NULL, NULL),
(2, 28, NULL, NULL),
(2, 29, NULL, NULL),
(3, 1, NULL, NULL),
(3, 3, NULL, NULL),
(3, 5, NULL, NULL),
(3, 6, NULL, NULL),
(3, 8, NULL, NULL),
(3, 9, NULL, NULL),
(3, 10, NULL, NULL),
(3, 11, NULL, NULL),
(3, 12, NULL, NULL),
(3, 13, NULL, NULL),
(3, 16, NULL, NULL),
(3, 17, NULL, NULL),
(3, 27, NULL, NULL),
(3, 28, NULL, NULL),
(3, 29, NULL, NULL),
(4, 2, NULL, NULL),
(4, 8, NULL, NULL),
(4, 9, NULL, NULL),
(15, 1, NULL, NULL),
(15, 2, NULL, NULL),
(15, 3, NULL, NULL),
(15, 5, NULL, NULL),
(15, 6, NULL, NULL),
(15, 7, NULL, NULL),
(15, 8, NULL, NULL),
(15, 9, NULL, NULL),
(15, 10, NULL, NULL),
(15, 11, NULL, NULL),
(15, 12, NULL, NULL),
(15, 20, NULL, NULL),
(15, 27, NULL, NULL),
(15, 28, NULL, NULL),
(199, 1, NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `role_permission_scopes`
--

CREATE TABLE `role_permission_scopes` (
  `id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `scope_type` varchar(32) NOT NULL DEFAULT 'group',
  `scope_mode` varchar(16) NOT NULL DEFAULT 'allow',
  `scope_ref_id` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `role_permission_scopes`
--

INSERT INTO `role_permission_scopes` (`id`, `role_id`, `permission_id`, `scope_type`, `scope_mode`, `scope_ref_id`, `created_at`) VALUES
(1, 1, 10, 'group', 'all', 0, '2026-10-08 04:48:15'),
(2, 2, 10, 'group', 'all', 0, '2026-10-08 04:48:15'),
(4, 3, 10, 'group', 'all', 0, '2026-10-08 15:54:25'),
(9, 15, 10, 'group', 'all', 0, '2026-10-08 17:37:07'),
(11, 199, 1, 'group', 'all', 0, '2026-10-26 20:37:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sla_policies`
--

CREATE TABLE `sla_policies` (
  `id` int(11) NOT NULL,
  `priority` varchar(20) NOT NULL,
  `response_hours` int(11) NOT NULL,
  `resolution_hours` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sla_policies`
--

INSERT INTO `sla_policies` (`id`, `priority`, `response_hours`, `resolution_hours`) VALUES
(1, 'high', 2, 8),
(2, 'medium', 4, 24),
(3, 'low', 8, 48);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solutions`
--

CREATE TABLE `solutions` (
  `id` int(11) NOT NULL,
  `title` varchar(200) NOT NULL,
  `content` mediumtext NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `subcategory` varchar(100) DEFAULT NULL,
  `tags` varchar(500) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `approval_status` varchar(20) NOT NULL DEFAULT 'pending',
  `share_all` tinyint(1) NOT NULL DEFAULT 0,
  `use_count` int(11) NOT NULL DEFAULT 0,
  `created_by` int(11) NOT NULL,
  `updated_by` int(11) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solutions`
--

INSERT INTO `solutions` (`id`, `title`, `content`, `category`, `subcategory`, `tags`, `status`, `approval_status`, `share_all`, `use_count`, `created_by`, `updated_by`, `approved_by`, `approved_at`, `created_at`, `updated_at`) VALUES
(1, 'Probaste reiniciar?', '<p>Probaste reiniciar?</p><p></p>', NULL, NULL, 'reiniciar, reinicio, rein', 'active', 'approved', 1, 4, 5, 5, 5, '2026-10-09 16:01:12', '2026-10-09 06:41:17', '2026-10-16 17:10:42'),
(2, 'Blanqueo de contraseña', '<p>Blanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseñaBlanqueo de contraseña</p>', NULL, NULL, NULL, 'active', 'approved', 1, 1, 5, 5, 5, '2026-10-09 16:20:16', '2026-10-09 16:20:10', '2026-10-09 16:20:33'),
(3, '123', '<p>213</p>', NULL, NULL, NULL, 'active', 'approved', 1, 1, 5, 5, 5, '2026-10-09 18:22:41', '2026-10-09 18:22:26', '2026-10-09 18:24:09'),
(4, '321', '<p>321</p>', NULL, NULL, NULL, 'active', 'approved', 1, 0, 5, 5, 5, '2026-10-09 18:22:34', '2026-10-09 18:22:32', '2026-10-09 18:22:34'),
(5, '321', '<p>321</p>', NULL, NULL, NULL, 'active', 'approved', 1, 0, 5, 5, 5, '2026-10-09 18:22:48', '2026-10-09 18:22:46', '2026-10-09 18:22:48'),
(6, 'xxxxxxxx', '<p>xxxxxxxxxxxxxx</p>', NULL, NULL, NULL, 'inactive', 'rejected', 1, 0, 5, 5, NULL, NULL, '2026-10-09 18:23:36', '2026-10-26 23:15:47'),
(7, 'ddddddddddddddd', '<p>ddddddddddd</p>', NULL, NULL, NULL, 'active', 'approved', 1, 0, 5, 5, 5, '2026-10-09 18:23:47', '2026-10-09 18:23:46', '2026-10-09 18:23:47'),
(9, 'Prueba imagen', '<p>Prueba imagen</p><img data-attachment-id=\"1\" />', NULL, NULL, NULL, 'active', 'approved', 1, 5, 5, 5, 5, '2026-10-16 03:15:21', '2026-10-15 20:39:53', '2026-10-16 13:29:04'),
(10, 'Imagen 2', '<img data-attachment-id=\"2\" /><p>fd</p>', NULL, NULL, NULL, 'active', 'approved', 1, 1, 5, 5, 5, '2026-10-15 21:22:04', '2026-10-15 21:22:02', '2026-10-15 21:22:13'),
(11, 'SQL', '<p>SQL</p>', NULL, NULL, 'SQL, DB, BASE DE DATOS, DDBB, BD', 'active', 'approved', 1, 0, 5, 5, 5, '2026-10-16 03:16:27', '2026-10-16 03:16:25', '2026-10-16 03:17:03');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solution_attachments`
--

CREATE TABLE `solution_attachments` (
  `id` int(11) NOT NULL,
  `solution_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solution_attachments`
--

INSERT INTO `solution_attachments` (`id`, `solution_id`, `user_id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `created_at`) VALUES
(1, 9, 5, 'image.png', '1792099295559-ed049fee556d36fb.png', 'image/png', 3510, '2026-10-15 21:21:35'),
(2, 10, 5, 'image.png', '1792099322888-c774e8762aa04a2d.png', 'image/png', 3510, '2026-10-15 21:22:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solution_groups`
--

CREATE TABLE `solution_groups` (
  `solution_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solution_uses`
--

CREATE TABLE `solution_uses` (
  `id` int(11) NOT NULL,
  `solution_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `solution_uses`
--

INSERT INTO `solution_uses` (`id`, `solution_id`, `ticket_id`, `user_id`, `created_at`) VALUES
(1, 1, 37, 13, '2026-10-09 16:01:31'),
(2, 2, 35, 5, '2026-10-09 16:20:33'),
(3, 1, 37, 5, '2026-10-09 16:51:42'),
(4, 3, 36, 5, '2026-10-09 18:24:09'),
(5, 1, 36, 5, '2026-10-15 18:40:13'),
(8, 9, 37, 5, '2026-10-15 20:40:27'),
(9, 9, 38, 5, '2026-10-15 21:20:40'),
(10, 9, 38, 5, '2026-10-15 21:21:13'),
(11, 10, 38, 5, '2026-10-15 21:22:13'),
(12, 9, 37, 5, '2026-10-15 21:44:42'),
(13, 9, 19, 5, '2026-10-16 13:29:04'),
(14, 1, 36, 5, '2026-10-16 17:10:42');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tickets`
--

CREATE TABLE `tickets` (
  `id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` mediumtext NOT NULL,
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
  `group_id` int(11) DEFAULT NULL,
  `technician_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tickets`
--

INSERT INTO `tickets` (`id`, `title`, `description`, `status`, `priority`, `created_at`, `user_id`, `updated_at`, `category`, `subcategory`, `type`, `sla_status`, `sla_response_due`, `sla_resolution_due`, `sla_paused_at`, `group_id`, `technician_id`) VALUES
(6, 'Contraseña no ingresa', 'Contraseña no ingresa', 'open', 'medium', '2026-06-19 03:10:04', 4, '2026-07-17 21:35:24', 'Red / Conectividad', 'VPN', 'incident', 'breached', '2026-06-19 10:10:04', '2026-06-20 06:10:04', NULL, 1, NULL),
(7, 'VPN error', '123 VPN error', 'in-progress', 'medium', '2026-06-19 03:18:03', 5, '2026-10-23 21:28:56', 'Red / Conectividad', 'VPN', 'incident', 'breached', '2026-06-19 16:18:03', '2026-06-20 12:18:03', NULL, 7, NULL),
(8, 'no tengo internet', 'se cortó de un memento a otro', 'resolved', 'high', '2026-06-19 06:02:43', 3, '2026-07-18 19:08:18', 'Red / Conectividad', 'Internet', 'incident', 'breached', '2026-06-20 11:02:45', '2026-06-20 17:02:45', NULL, 1, NULL),
(10, 'Error JIRA', 'Error JIRA', 'open', 'medium', '2026-06-19 07:06:26', 5, '2026-07-18 19:40:33', 'Software', 'Aplicaciones', 'incident', 'breached', '2026-06-19 17:06:26', '2026-06-20 13:06:26', NULL, 4, NULL),
(11, 'Error URL', 'Error URL', 'resolved', 'medium', '2026-06-20 04:06:52', 5, '2026-07-17 21:35:24', 'Otro', 'Otro', 'incident', 'breached', '2026-06-20 11:06:52', '2026-06-21 07:06:52', NULL, 1, NULL),
(12, 'Pedido de teclado', 'Pedido de teclado nuevo se rompio el anterior unu', 'resolved', NULL, '2026-06-22 02:47:40', 5, '2026-07-18 19:40:35', 'Hardware', 'Periféricos', 'requirement', NULL, NULL, NULL, NULL, 4, NULL),
(13, 'prueba', 'prueba', 'resolved', 'medium', '2026-06-22 14:35:15', 3, '2026-07-18 19:03:08', 'Software', 'Sistema operativo', 'incident', 'breached', '2026-06-23 18:35:15', '2026-06-24 14:35:15', NULL, 1, NULL),
(15, 'Funciona el envío de mail?', 'Funciona el envío de mail?', 'open', 'medium', '2026-06-22 23:36:40', 8, '2026-07-17 21:35:24', NULL, NULL, 'incident', 'breached', '2026-06-23 06:36:40', '2026-06-24 02:36:40', NULL, 1, NULL),
(16, 'No funca eso', 'No funca eso', 'open', 'low', '2026-07-17 19:56:22', 3, '2026-07-18 10:05:37', 'Software', 'Otro', 'incident', 'on_track', '2026-07-20 05:31:53', '2026-07-21 21:31:53', NULL, 2, 3),
(17, 'Eliminar cache de servidor', 'Eliminar cache de servidor', 'open', NULL, '2026-07-18 08:43:45', 4, '2026-07-18 09:42:56', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 1, 9),
(19, 'Backbone caido', 'Backbone caido', 'in-progress', 'low', '2026-07-18 09:01:59', 4, '2026-10-23 21:09:53', 'Red / Conectividad', 'Otro', 'incident', 'breached', '2026-07-19 01:28:46', '2026-07-19 21:28:46', NULL, 3, NULL),
(21, 'ea', 'ea', 'resolved', 'medium', '2026-07-18 10:52:54', 11, '2026-10-09 05:22:38', 'Hardware', NULL, 'incident', 'met', '2026-07-19 08:52:54', '2026-07-20 04:52:54', NULL, 3, NULL),
(23, 'difsfsdofkdsafdsafdsf', 'fdsafsdafdsafsadfdfsafdafadsffds', 'open', NULL, '2026-07-18 11:01:45', 7, '2026-07-18 19:40:23', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 4, NULL),
(24, 'No funciona equipo Meraki', 'No funciona equipo Meraki', 'resolved', NULL, '2026-07-18 19:25:06', 12, '2026-07-20 02:47:26', 'Red / Conectividad', 'VPN', 'requirement', NULL, NULL, NULL, NULL, 3, 13),
(25, 'Pedido acceso HML', 'Pedido acceso HML', 'open', NULL, '2026-07-18 19:26:05', 12, '2026-10-26 06:07:32', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 5, 27),
(26, 'Phishing perdi el aguinaldo', 'Phishing perdi el aguinaldo', 'resolved', 'medium', '2026-07-18 20:23:01', 12, '2026-07-20 02:57:29', 'Otro', 'Otro', 'incident', 'met', '2026-07-20 03:23:01', '2026-07-20 23:23:01', NULL, 2, 13),
(28, 'Prueba', 'Prueba', 'resolved', 'medium', '2026-09-14 13:41:18', 5, '2026-10-09 04:19:57', NULL, NULL, 'incident', 'breached', '2026-09-15 08:41:18', '2026-09-16 04:41:18', NULL, 5, NULL),
(29, '123123123', '11111111111111', 'resolved', 'medium', '2026-10-07 03:15:26', 5, '2026-10-09 04:11:45', NULL, NULL, 'incident', 'met', '2026-10-07 16:15:26', '2026-10-08 12:15:26', NULL, 3, NULL),
(30, '666', '666', 'open', 'medium', '2026-10-08 00:22:17', 5, '2026-10-09 04:19:48', NULL, NULL, 'incident', 'breached', '2026-10-08 10:22:17', '2026-10-09 06:22:17', NULL, 4, NULL),
(31, 'Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas', 'Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.', 'open', NULL, '2026-10-08 00:26:21', 5, '2026-10-09 04:11:37', 'Otro', 'Consulta general', 'requirement', NULL, NULL, NULL, NULL, 5, 9),
(33, 'WDW', 'WDW', 'resolved', 'high', '2026-10-08 02:39:16', 5, '2026-10-09 04:09:06', NULL, NULL, 'incident', 'breached', '2026-10-08 22:39:16', '2026-10-09 04:39:16', NULL, 2, NULL),
(34, '444', '4444', 'open', 'medium', '2026-10-08 17:45:08', 13, '2026-10-09 04:05:42', NULL, NULL, 'incident', 'on_track', '2026-10-09 15:45:08', '2026-10-10 11:45:08', NULL, 4, NULL),
(35, 'Problemas', 'Problemas', 'open', 'medium', '2026-10-09 04:41:05', 5, '2026-10-09 04:41:05', NULL, NULL, 'incident', 'on_track', '2026-10-09 11:41:05', '2026-10-10 07:41:05', NULL, 1, NULL),
(36, 'PRUEBA CAMPO DESCRIPCION', '<p>pr<strong>ueba</strong><span style=\"color: rgb(255, 0, 0);\"><strong> fffsfsfsf</strong></span><span style=\"color: rgb(0, 0, 0);\"><strong><mark data-color=\"#ff0000\" style=\"background-color: rgb(255, 0, 0); color: inherit;\">dsffsdfsdf</mark></strong></span></p><img data-attachment-id=\"5\">', 'open', 'medium', '2026-10-09 05:38:11', 12, '2026-10-15 18:40:30', NULL, NULL, 'incident', 'breached', '2026-10-09 21:38:11', '2026-10-10 17:38:11', NULL, 1, NULL),
(37, 'FFFFF', '<p><strong>FSDFSDFSDFSDF</strong></p><img data-attachment-id=\"6\" />', 'resolved', 'medium', '2026-10-09 05:40:03', 5, '2026-10-15 22:38:45', NULL, NULL, 'incident', 'breached', '2026-10-10 15:40:03', '2026-10-11 11:40:03', NULL, 6, 9),
(38, 'No funca', '<p><strong>fdffsFSDFSDFA<em>FSFSDFFSDFSAAFSDAF<u>FSDFSDAFSSDAFSDAFSA</u></em></strong></p><p></p><img data-attachment-id=\"7\" />', 'open', 'medium', '2026-10-09 16:53:25', 5, '2026-10-15 21:20:46', 'Hardware', 'Impresora', 'incident', 'breached', '2026-10-10 20:53:25', '2026-10-11 16:53:25', NULL, 2, 9),
(39, 'Prueba ticket usuario VISTA', '<p>Prueba ticket usuario VISTA</p>', 'resolved', 'medium', '2026-10-19 15:33:59', 24, '2026-10-22 03:15:48', NULL, NULL, 'incident', 'met', '2026-10-20 01:33:59', '2026-10-20 21:33:59', NULL, 1, NULL),
(40, 'Problemas con DNS', '<p>Problemas con DNS</p>', 'open', 'medium', '2026-10-22 04:02:38', 16, '2026-10-23 21:39:07', 'Hardware', 'Proyector', 'incident', 'breached', '2026-10-22 11:02:38', '2026-10-23 07:02:38', NULL, 3, 23),
(41, 'Grant en BBDD', '<p>Grant en BBDD</p>', 'open', NULL, '2026-10-22 04:03:11', 16, '2026-10-23 21:09:43', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 6, NULL),
(42, 'Corte de Fibra Optica por poda', '<p>Corte de Fibra Optica por poda</p>', 'on-hold', 'medium', '2026-10-22 04:03:45', 16, '2026-10-26 03:37:22', NULL, NULL, 'incident', 'paused', '2026-10-22 14:03:45', '2026-10-23 10:03:45', '2026-10-26 06:37:22', 1, NULL),
(43, 'Problemas repositorio HML', '<p>Problemas repositorio HML</p>', 'on-hold', 'medium', '2026-10-22 04:04:16', 16, '2026-10-27 01:10:15', NULL, NULL, 'incident', 'paused', '2026-10-22 17:04:16', '2026-10-23 13:04:16', '2026-10-27 04:10:15', 3, NULL),
(44, 'Acceso carpeta compartida', '<p>Acceso carpeta compartida </p>', 'open', NULL, '2026-10-22 04:04:36', 16, '2026-10-26 03:39:41', 'Software', 'Otro', 'requirement', NULL, NULL, NULL, NULL, 1, 13),
(45, 'Formateo notebook', '<p>Formateo notebook</p>', 'on-hold', NULL, '2026-10-22 04:05:27', 16, '2026-10-26 03:35:23', 'Hardware', 'Computadora / Notebook', 'requirement', NULL, NULL, NULL, NULL, 2, NULL),
(46, 'Aumento almacenamiento de VM', '<p style=\"text-align:left\">Aumento almacenamiento de VMAumento almacenamiento de VM</p>', 'open', NULL, '2026-10-22 04:06:04', 16, '2026-10-23 21:24:51', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 1, 21),
(48, 'Agregar disco SSD a notebook', '<p>Agregar disco SSD a notebook</p>', 'resolved', NULL, '2026-10-23 18:12:51', 5, '2026-10-23 20:51:04', 'Hardware', 'Computadora / Notebook', 'requirement', NULL, NULL, NULL, NULL, 1, 9),
(49, 'Grant en MariaDB', '<p>Grant en MariaDB</p>', 'open', NULL, '2026-10-26 03:54:35', 5, '2026-10-26 03:54:35', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 1, NULL),
(50, 'No me abre el correo', '<p>No me abre el correo</p>', 'on-hold', 'medium', '2026-10-26 03:55:00', 12, '2026-10-27 01:10:11', NULL, NULL, 'incident', 'paused', '2026-10-26 13:55:00', '2026-10-27 09:55:00', '2026-10-27 04:10:11', 1, NULL),
(51, '123', '<p>132</p>', 'open', 'medium', '2026-10-26 05:58:16', 5, '2026-10-26 05:58:16', NULL, NULL, 'incident', 'on_track', '2026-10-26 12:58:16', '2026-10-27 08:58:16', NULL, 1, NULL),
(52, 'Todo el edificio sin internet', '<p>Todo el edificiio sin interntet</p>', 'on-hold', 'high', '2026-10-26 18:52:32', 5, '2026-10-27 01:10:01', NULL, NULL, 'incident', 'paused', '2026-10-27 02:52:32', '2026-10-27 08:52:32', '2026-10-27 04:10:01', 1, NULL),
(53, 'Deploy PRD', '<p>Deploy PRD</p>', 'open', NULL, '2026-10-27 04:10:16', 12, '2026-10-27 04:10:16', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 1, NULL),
(54, 'Heavy Duty', '<p>Heavy Duty</p>', 'open', NULL, '2026-10-27 19:52:23', 29, '2026-10-27 19:52:23', NULL, NULL, 'requirement', NULL, NULL, NULL, NULL, 1, NULL),
(55, 'Cambio de bateria notebook', '<p>Cambio de bateria notebook</p>', 'open', 'medium', '2026-10-27 20:11:41', 5, '2026-10-27 20:11:41', NULL, NULL, 'incident', 'on_track', '2026-10-28 03:11:41', '2026-10-28 23:11:41', NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_attachments`
--

CREATE TABLE `ticket_attachments` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `original_name` varchar(255) NOT NULL,
  `stored_name` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `size_bytes` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_inline` tinyint(1) NOT NULL DEFAULT 0,
  `context` varchar(20) NOT NULL DEFAULT 'ticket',
  `comment_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_attachments`
--

INSERT INTO `ticket_attachments` (`id`, `ticket_id`, `user_id`, `original_name`, `stored_name`, `mime_type`, `size_bytes`, `created_at`, `is_inline`, `context`, `comment_id`) VALUES
(1, 6, 4, 'WhatsApp Image 2025-08-17 at 12.45.02 AM.jpeg', '1784363221932-87a827337f695792.jpeg', 'image/jpeg', 52798, '2026-07-18 08:27:01', 0, 'ticket', NULL),
(2, 6, 4, 'b9295c36353cc68ce2de798182f2d10c.jpg', '1784364461602-d47b55796b5c8fc7.jpg', 'image/jpeg', 121674, '2026-07-18 08:47:41', 0, 'ticket', NULL),
(5, 36, 12, 'image.png', '1791524291603-f7ca4557d6aaa7a2.png', 'image/png', 6820, '2026-10-09 05:38:11', 1, 'ticket', NULL),
(6, 37, 5, 'image.png', '1791524576938-ac6e81febcd0b79d.png', 'image/png', 6820, '2026-10-09 05:42:56', 1, 'ticket', NULL),
(7, 38, 5, 'image.png', '1791564805424-e9f140f773a5735f.png', 'image/png', 33564, '2026-10-09 16:53:25', 1, 'ticket', NULL),
(8, 38, 5, 'b9295c36353cc68ce2de798182f2d10c.jpg', '1792096679297-16118200c10a9536.jpg', 'image/jpeg', 121674, '2026-10-15 20:37:59', 0, 'comment', 37),
(9, 38, 5, 'image.png', '1792096692396-d27cc030b6643b0f.png', 'image/png', 3510, '2026-10-15 20:38:12', 1, 'comment', 37),
(11, 38, 5, 'image.png', '1792099333291-e7a27f9dac8b1cb9.png', 'image/png', 3510, '2026-10-15 21:22:13', 1, 'resolution', NULL),
(12, 37, 5, 'image.png', '1792100682872-4685dea677de9446.png', 'image/png', 3510, '2026-10-15 21:44:42', 1, 'resolution', NULL),
(13, 19, 5, 'image.png', '1792157344249-6f243fd0b81f510c.png', 'image/png', 3510, '2026-10-16 13:29:04', 1, 'resolution', NULL),
(14, 42, 5, 'kingkongametrallando.jpg', '1792784237299-816628ea8c56b4fb.jpg', 'image/jpeg', 43123, '2026-10-23 19:37:17', 0, 'ticket', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_comments`
--

CREATE TABLE `ticket_comments` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `content` mediumtext NOT NULL,
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
(19, 15, 5, 'fewfsdfsd', '2026-07-17 16:06:20'),
(20, 17, 4, 'ssda', '2026-07-18 08:46:43'),
(21, 6, 4, 'v', '2026-07-18 08:52:08'),
(22, 6, 4, 'dfsdfds', '2026-07-18 08:57:01'),
(24, 23, 7, 'ggdfgfd', '2026-07-18 11:02:32'),
(25, 21, 5, 'gds', '2026-07-18 19:19:50'),
(26, 21, 5, 'saddsadas', '2026-07-18 19:21:07'),
(27, 25, 12, 'sfsdfsdf', '2026-07-18 19:26:20'),
(28, 25, 12, 'Solucionado!', '2026-07-18 19:26:31'),
(29, 26, 13, 'epa', '2026-07-18 20:25:09'),
(30, 26, 12, 'no funca', '2026-07-18 20:33:36'),
(31, 24, 5, 'hola', '2026-07-20 02:46:27'),
(32, 24, 5, 'fdsfsfds', '2026-07-20 02:46:41'),
(33, 21, 5, 'purba', '2026-09-14 13:42:33'),
(34, 28, 13, 'asd', '2026-10-02 20:10:05'),
(35, 31, 5, '132', '2026-10-08 04:01:51'),
(37, 38, 5, '<p>Pruba nota</p><img data-attachment-id=\"9\" />', '2026-10-15 20:37:59'),
(38, 36, 5, '<p>comentario1 </p>', '2026-10-22 03:38:00'),
(39, 36, 5, '<p>comnetario 2</p><p></p>', '2026-10-22 03:38:06'),
(40, 42, 5, '<p>Detenido por inundación </p>', '2026-10-23 19:33:45');

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
(41, 16, 5, 'updated', 'sla_paused_at', NULL, '2026-07-17 21:51:16', '2026-07-17 21:51:16'),
(42, 17, 4, 'created', 'type', NULL, 'requirement', '2026-07-18 08:43:45'),
(43, 17, 4, 'created', 'status', NULL, 'open', '2026-07-18 08:43:45'),
(44, 17, 4, 'created', 'title', NULL, 'Eliminar cache de servidor', '2026-07-18 08:43:45'),
(48, 19, 4, 'created', 'type', NULL, 'incident', '2026-07-18 09:01:59'),
(49, 19, 4, 'created', 'status', NULL, 'open', '2026-07-18 09:01:59'),
(50, 19, 4, 'created', 'title', NULL, 'Backbone caido', '2026-07-18 09:01:59'),
(51, 19, 4, 'created', 'priority', NULL, 'medium', '2026-07-18 09:01:59'),
(52, 19, 5, 'updated', 'status', 'open', 'on-hold', '2026-07-18 09:04:14'),
(53, 19, 5, 'updated', 'priority', 'medium', 'low', '2026-07-18 09:04:14'),
(54, 19, 5, 'updated', 'category', NULL, 'Red / Conectividad', '2026-07-18 09:04:14'),
(55, 19, 5, 'updated', 'sla_status', 'on_track', 'paused', '2026-07-18 09:04:14'),
(56, 19, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 09:01:59 GMT-0300 (hora estándar de Argentina)', '2026-07-19 12:01:59', '2026-07-18 09:04:14'),
(57, 19, 5, 'updated', 'sla_paused_at', NULL, '2026-07-18 09:04:14', '2026-07-18 09:04:14'),
(58, 19, 5, 'updated', 'subcategory', NULL, 'Otro', '2026-07-18 09:04:14'),
(59, 19, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 13:01:59 GMT-0300 (hora estándar de Argentina)', '2026-07-18 16:01:59', '2026-07-18 09:04:14'),
(60, 19, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 16:01:59 GMT-0300 (hora estándar de Argentina)', '2026-07-18 19:01:59', '2026-07-18 09:07:08'),
(61, 19, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 12:01:59 GMT-0300 (hora estándar de Argentina)', '2026-07-19 15:01:59', '2026-07-18 09:07:08'),
(62, 19, 5, 'updated', 'sla_paused_at', 'Sat Jul 18 2026 09:04:14 GMT-0300 (hora estándar de Argentina)', '2026-07-18 12:04:14', '2026-07-18 09:07:08'),
(63, 12, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 09:25:21'),
(64, 19, 9, 'updated', 'status', 'on-hold', 'in-progress', '2026-07-18 09:31:01'),
(65, 19, 9, 'updated', 'sla_response_due', 'Sat Jul 18 2026 19:01:59 GMT-0300 (hora estándar de Argentina)', '2026-07-18 16:28:46', '2026-07-18 09:31:01'),
(66, 19, 9, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 15:01:59 GMT-0300 (hora estándar de Argentina)', '2026-07-19 12:28:46', '2026-07-18 09:31:01'),
(67, 19, 9, 'updated', 'sla_paused_at', 'Sat Jul 18 2026 12:04:14 GMT-0300 (hora estándar de Argentina)', NULL, '2026-07-18 09:31:01'),
(68, 19, 9, 'updated', 'sla_status', 'paused', 'on_track', '2026-07-18 09:31:01'),
(69, 19, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 16:28:46 GMT-0300 (hora estándar de Argentina)', '2026-07-18 19:28:46', '2026-07-18 09:42:50'),
(70, 19, 5, 'updated', 'technician_id', NULL, '9', '2026-07-18 09:42:50'),
(71, 19, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 12:28:46 GMT-0300 (hora estándar de Argentina)', '2026-07-19 15:28:46', '2026-07-18 09:42:50'),
(72, 17, 5, 'updated', 'technician_id', NULL, '9', '2026-07-18 09:42:56'),
(73, 16, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 05:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-19 08:33:18', '2026-07-18 09:42:59'),
(74, 16, 5, 'updated', 'technician_id', NULL, '3', '2026-07-18 09:42:59'),
(75, 16, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 21:33:18 GMT-0300 (hora estándar de Argentina)', '2026-07-21 00:33:18', '2026-07-18 09:42:59'),
(76, 16, 5, 'updated', 'sla_paused_at', 'Fri Jul 17 2026 21:51:16 GMT-0300 (hora estándar de Argentina)', '2026-07-18 00:51:16', '2026-07-18 09:42:59'),
(77, 16, 3, 'updated', 'status', 'on-hold', 'resolved', '2026-07-18 09:49:51'),
(78, 16, 3, 'updated', 'status', 'resolved', 'in-progress', '2026-07-18 10:01:58'),
(79, 16, 3, 'updated', 'sla_response_due', 'Sun Jul 19 2026 17:31:53 GMT-0300 (hora estándar de Argentina)', '2026-07-19 20:31:53', '2026-07-18 10:01:58'),
(80, 16, 3, 'updated', 'sla_status', 'met', 'on_track', '2026-07-18 10:01:58'),
(81, 16, 3, 'updated', 'sla_resolution_due', 'Tue Jul 21 2026 09:31:53 GMT-0300 (hora estándar de Argentina)', '2026-07-21 12:31:53', '2026-07-18 10:01:58'),
(82, 16, 3, 'updated', 'status', 'in-progress', 'resolved', '2026-07-18 10:05:33'),
(83, 16, 3, 'updated', 'status', 'resolved', 'open', '2026-07-18 10:05:37'),
(84, 16, 3, 'updated', 'sla_response_due', 'Sun Jul 19 2026 23:31:53 GMT-0300 (hora estándar de Argentina)', '2026-07-20 02:31:53', '2026-07-18 10:05:37'),
(85, 16, 3, 'updated', 'sla_status', 'met', 'on_track', '2026-07-18 10:05:37'),
(86, 16, 3, 'updated', 'sla_resolution_due', 'Tue Jul 21 2026 15:31:53 GMT-0300 (hora estándar de Argentina)', '2026-07-21 18:31:53', '2026-07-18 10:05:37'),
(91, 21, 11, 'created', 'type', NULL, 'incident', '2026-07-18 10:52:54'),
(92, 21, 11, 'created', 'status', NULL, 'open', '2026-07-18 10:52:54'),
(93, 21, 11, 'created', 'title', NULL, 'ea', '2026-07-18 10:52:54'),
(94, 21, 11, 'created', 'priority', NULL, 'medium', '2026-07-18 10:52:54'),
(107, 23, 7, 'created', 'type', NULL, 'requirement', '2026-07-18 11:01:45'),
(108, 23, 7, 'created', 'status', NULL, 'open', '2026-07-18 11:01:45'),
(109, 23, 7, 'created', 'title', NULL, 'difsfsdofkdsafdsafdsf', '2026-07-18 11:01:45'),
(119, 13, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:00:52'),
(120, 13, 5, 'updated', 'status', 'resolved', 'open', '2026-07-18 19:01:02'),
(121, 13, 5, 'updated', 'sla_resolution_due', 'Tue Jun 23 2026 17:35:15 GMT-0300 (hora estándar de Argentina)', '2026-06-23 20:35:15', '2026-07-18 19:01:02'),
(122, 13, 5, 'updated', 'sla_response_due', 'Mon Jun 22 2026 21:35:15 GMT-0300 (hora estándar de Argentina)', '2026-06-23 00:35:15', '2026-07-18 19:01:02'),
(123, 13, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:02:27'),
(124, 13, 5, 'updated', 'status', 'resolved', 'open', '2026-07-18 19:02:31'),
(125, 13, 5, 'updated', 'sla_response_due', 'Tue Jun 23 2026 03:35:15 GMT-0300 (hora estándar de Argentina)', '2026-06-23 06:35:15', '2026-07-18 19:02:31'),
(126, 13, 5, 'updated', 'sla_resolution_due', 'Tue Jun 23 2026 23:35:15 GMT-0300 (hora estándar de Argentina)', '2026-06-24 02:35:15', '2026-07-18 19:02:31'),
(127, 13, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:02:48'),
(128, 13, 5, 'updated', 'status', 'resolved', 'open', '2026-07-18 19:02:49'),
(129, 13, 5, 'updated', 'sla_response_due', 'Tue Jun 23 2026 09:35:15 GMT-0300 (hora estándar de Argentina)', '2026-06-23 12:35:15', '2026-07-18 19:02:49'),
(130, 13, 5, 'updated', 'sla_resolution_due', 'Wed Jun 24 2026 05:35:15 GMT-0300 (hora estándar de Argentina)', '2026-06-24 08:35:15', '2026-07-18 19:02:49'),
(131, 13, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:03:08'),
(132, 8, 5, 'updated', 'status', 'open', 'in-progress', '2026-07-18 19:05:42'),
(133, 8, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 08:02:43 GMT-0300 (hora estándar de Argentina)', '2026-06-19 11:02:43', '2026-07-18 19:05:42'),
(134, 8, 5, 'updated', 'sla_resolution_due', 'Fri Jun 19 2026 14:02:43 GMT-0300 (hora estándar de Argentina)', '2026-06-19 17:02:43', '2026-07-18 19:05:42'),
(135, 8, 5, 'updated', 'status', 'in-progress', 'on-hold', '2026-07-18 19:05:45'),
(136, 8, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 11:02:43 GMT-0300 (hora estándar de Argentina)', '2026-06-19 14:02:43', '2026-07-18 19:05:45'),
(137, 8, 5, 'updated', 'sla_resolution_due', 'Fri Jun 19 2026 17:02:43 GMT-0300 (hora estándar de Argentina)', '2026-06-19 20:02:43', '2026-07-18 19:05:45'),
(138, 8, 5, 'updated', 'sla_paused_at', NULL, '2026-07-18 19:05:45', '2026-07-18 19:05:45'),
(139, 8, 5, 'updated', 'sla_status', 'breached', 'paused', '2026-07-18 19:05:45'),
(140, 8, 5, 'updated', 'status', 'on-hold', 'resolved', '2026-07-18 19:05:47'),
(141, 8, 5, 'updated', 'sla_resolution_due', 'Fri Jun 19 2026 20:02:43 GMT-0300 (hora estándar de Argentina)', '2026-06-19 20:02:45', '2026-07-18 19:05:47'),
(142, 8, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 14:02:43 GMT-0300 (hora estándar de Argentina)', '2026-06-19 14:02:45', '2026-07-18 19:05:47'),
(143, 8, 5, 'updated', 'sla_paused_at', 'Sat Jul 18 2026 19:05:45 GMT-0300 (hora estándar de Argentina)', NULL, '2026-07-18 19:05:47'),
(144, 8, 5, 'updated', 'sla_status', 'paused', 'breached', '2026-07-18 19:05:47'),
(145, 8, 5, 'updated', 'status', 'resolved', 'open', '2026-07-18 19:05:49'),
(146, 8, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 14:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-19 17:02:45', '2026-07-18 19:05:49'),
(147, 8, 5, 'updated', 'sla_resolution_due', 'Fri Jun 19 2026 20:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-19 23:02:45', '2026-07-18 19:05:49'),
(148, 8, 5, 'updated', 'status', 'open', 'in-progress', '2026-07-18 19:05:52'),
(149, 8, 5, 'updated', 'sla_resolution_due', 'Fri Jun 19 2026 23:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-20 02:02:45', '2026-07-18 19:05:52'),
(150, 8, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 17:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-19 20:02:45', '2026-07-18 19:05:52'),
(151, 8, 5, 'updated', 'status', 'in-progress', 'open', '2026-07-18 19:05:54'),
(152, 8, 5, 'updated', 'sla_resolution_due', 'Sat Jun 20 2026 02:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-20 05:02:45', '2026-07-18 19:05:54'),
(153, 8, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 20:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-19 23:02:45', '2026-07-18 19:05:54'),
(154, 8, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:06:07'),
(155, 8, 5, 'updated', 'status', 'resolved', 'open', '2026-07-18 19:06:09'),
(156, 8, 5, 'updated', 'sla_response_due', 'Sat Jun 20 2026 02:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-20 05:02:45', '2026-07-18 19:06:09'),
(157, 8, 5, 'updated', 'sla_resolution_due', 'Sat Jun 20 2026 08:02:45 GMT-0300 (hora estándar de Argentina)', '2026-06-20 11:02:45', '2026-07-18 19:06:09'),
(158, 8, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:08:18'),
(159, 8, 5, 'updated', 'resolution', NULL, 'ok', '2026-07-18 19:08:18'),
(160, 21, 5, 'updated', 'status', 'open', 'resolved', '2026-07-18 19:15:08'),
(161, 21, 5, 'updated', 'resolution', NULL, 'ok', '2026-07-18 19:15:08'),
(162, 21, 5, 'updated', 'category', NULL, 'Hardware', '2026-07-18 19:22:11'),
(163, 21, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 13:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-19 16:52:54', '2026-07-18 19:22:11'),
(164, 21, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 17:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-18 20:52:54', '2026-07-18 19:22:11'),
(165, 24, 12, 'created', 'type', NULL, 'requirement', '2026-07-18 19:25:06'),
(166, 24, 12, 'created', 'status', NULL, 'open', '2026-07-18 19:25:06'),
(167, 24, 12, 'created', 'title', NULL, 'No funciona equipo Meraki', '2026-07-18 19:25:06'),
(168, 25, 12, 'created', 'type', NULL, 'requirement', '2026-07-18 19:26:05'),
(169, 25, 12, 'created', 'status', NULL, 'open', '2026-07-18 19:26:05'),
(170, 25, 12, 'created', 'title', NULL, 'Pedido acceso HML', '2026-07-18 19:26:05'),
(171, 25, 5, 'updated', 'group_id', '1', '3', '2026-07-18 19:40:19'),
(172, 24, 5, 'updated', 'group_id', '1', '3', '2026-07-18 19:40:21'),
(173, 23, 5, 'updated', 'group_id', '1', '4', '2026-07-18 19:40:23'),
(174, 21, 5, 'updated', 'group_id', '1', '2', '2026-07-18 19:40:26'),
(175, 21, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 20:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-18 23:52:54', '2026-07-18 19:40:26'),
(176, 21, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 16:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-19 19:52:54', '2026-07-18 19:40:26'),
(177, 21, 5, 'updated', 'group_id', '2', '1', '2026-07-18 19:40:28'),
(178, 21, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 23:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-19 02:52:54', '2026-07-18 19:40:28'),
(179, 21, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 19:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-19 22:52:54', '2026-07-18 19:40:28'),
(180, 10, 5, 'updated', 'group_id', '1', '4', '2026-07-18 19:40:34'),
(181, 10, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 11:06:26 GMT-0300 (hora estándar de Argentina)', '2026-06-19 14:06:26', '2026-07-18 19:40:34'),
(182, 10, 5, 'updated', 'sla_resolution_due', 'Sat Jun 20 2026 07:06:26 GMT-0300 (hora estándar de Argentina)', '2026-06-20 10:06:26', '2026-07-18 19:40:34'),
(183, 12, 5, 'updated', 'group_id', '1', '4', '2026-07-18 19:40:35'),
(184, 7, 5, 'updated', 'group_id', '1', '3', '2026-07-18 19:40:38'),
(185, 7, 5, 'updated', 'sla_response_due', 'Fri Jun 19 2026 07:18:03 GMT-0300 (hora estándar de Argentina)', '2026-06-19 10:18:03', '2026-07-18 19:40:38'),
(186, 7, 5, 'updated', 'sla_resolution_due', 'Sat Jun 20 2026 03:18:03 GMT-0300 (hora estándar de Argentina)', '2026-06-20 06:18:03', '2026-07-18 19:40:38'),
(187, 26, 12, 'created', 'status', NULL, 'open', '2026-07-18 20:23:01'),
(188, 26, 12, 'created', 'priority', NULL, 'medium', '2026-07-18 20:23:01'),
(189, 26, 12, 'created', 'title', NULL, 'Phishing perdi el aguinaldo', '2026-07-18 20:23:01'),
(190, 26, 12, 'created', 'type', NULL, 'incident', '2026-07-18 20:23:01'),
(191, 26, 5, 'updated', 'category', NULL, 'Hardware', '2026-07-18 20:24:24'),
(192, 26, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 20:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 23:23:01', '2026-07-18 20:24:24'),
(193, 26, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 00:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 03:23:01', '2026-07-18 20:24:24'),
(194, 26, 5, 'updated', 'category', 'Hardware', 'Otro', '2026-07-18 20:24:29'),
(195, 26, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 03:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 06:23:01', '2026-07-18 20:24:29'),
(196, 26, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 23:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-20 02:23:01', '2026-07-18 20:24:29'),
(197, 26, 5, 'updated', 'subcategory', NULL, 'Otro', '2026-07-18 20:24:31'),
(198, 26, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 02:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-20 05:23:01', '2026-07-18 20:24:31'),
(199, 26, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 06:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 09:23:01', '2026-07-18 20:24:31'),
(200, 26, 5, 'updated', 'group_id', '1', '2', '2026-07-18 20:24:35'),
(201, 26, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 09:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 12:23:01', '2026-07-18 20:24:35'),
(202, 26, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 05:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-20 08:23:01', '2026-07-18 20:24:35'),
(203, 26, 5, 'updated', 'technician_id', NULL, '13', '2026-07-18 20:24:38'),
(204, 26, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 12:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 15:23:01', '2026-07-18 20:24:38'),
(205, 26, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 08:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-20 11:23:01', '2026-07-18 20:24:38'),
(216, 24, 5, 'updated', 'status', 'open', 'in-progress', '2026-07-20 02:45:28'),
(217, 24, 5, 'updated', 'status', 'in-progress', 'on-hold', '2026-07-20 02:45:32'),
(218, 24, 5, 'updated', 'status', 'on-hold', 'resolved', '2026-07-20 02:45:37'),
(219, 24, 5, 'updated', 'category', NULL, 'Red / Conectividad', '2026-07-20 02:47:26'),
(220, 24, 5, 'updated', 'subcategory', NULL, 'VPN', '2026-07-20 02:47:26'),
(221, 24, 5, 'updated', 'technician_id', NULL, '13', '2026-07-20 02:47:26'),
(222, 26, 5, 'updated', 'status', 'open', 'resolved', '2026-07-20 02:49:24'),
(223, 26, 5, 'updated', 'resolution', NULL, 'ok', '2026-07-20 02:49:24'),
(224, 26, 5, 'updated', 'status', 'resolved', 'open', '2026-07-20 02:49:43'),
(225, 26, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 18:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-19 21:23:01', '2026-07-20 02:49:43'),
(226, 26, 5, 'updated', 'sla_resolution_due', 'Mon Jul 20 2026 14:23:01 GMT-0300 (hora estándar de Argentina)', '2026-07-20 17:23:01', '2026-07-20 02:49:43'),
(227, 26, 5, 'updated', 'sla_status', 'met', 'at_risk', '2026-07-20 02:49:43'),
(228, 26, 13, 'updated', 'status', 'open', 'resolved', '2026-07-20 02:57:29'),
(229, 26, 13, 'updated', 'resolution', NULL, 'se resolvio, cambie el coso', '2026-07-20 02:57:29'),
(230, 28, 5, 'created', 'type', NULL, 'incident', '2026-09-14 13:41:18'),
(231, 28, 5, 'created', 'status', NULL, 'open', '2026-09-14 13:41:18'),
(232, 28, 5, 'created', 'title', NULL, 'Prueba', '2026-09-14 13:41:18'),
(233, 28, 5, 'created', 'priority', NULL, 'medium', '2026-09-14 13:41:18'),
(234, 28, 13, 'updated', 'status', 'open', 'resolved', '2026-10-02 20:10:45'),
(235, 28, 13, 'updated', 'resolution', NULL, 'ok', '2026-10-02 20:10:45'),
(236, 28, 13, 'updated', 'sla_response_due', 'Mon Sep 14 2026 20:41:18 GMT-0300 (hora estándar de Argentina)', '2026-09-14 23:41:18', '2026-10-02 20:10:47'),
(237, 28, 13, 'updated', 'status', 'resolved', 'open', '2026-10-02 20:10:47'),
(238, 28, 13, 'updated', 'sla_status', 'met', 'breached', '2026-10-02 20:10:47'),
(239, 28, 13, 'updated', 'sla_resolution_due', 'Tue Sep 15 2026 16:41:18 GMT-0300 (hora estándar de Argentina)', '2026-09-15 19:41:18', '2026-10-02 20:10:47'),
(240, 28, 13, 'updated', 'status', 'open', 'resolved', '2026-10-07 00:26:04'),
(241, 28, 13, 'updated', 'resolution', NULL, 'resueklto', '2026-10-07 00:26:04'),
(242, 29, 5, 'created', 'type', NULL, 'incident', '2026-10-07 03:15:26'),
(243, 29, 5, 'created', 'status', NULL, 'open', '2026-10-07 03:15:26'),
(244, 29, 5, 'created', 'title', NULL, '123123123', '2026-10-07 03:15:26'),
(245, 29, 5, 'created', 'priority', NULL, 'medium', '2026-10-07 03:15:26'),
(246, 29, 13, 'updated', 'sla_response_due', 'Wed Oct 07 2026 07:15:26 GMT-0300 (hora estándar de Argentina)', '2026-10-07 10:15:26', '2026-10-07 03:20:07'),
(247, 29, 13, 'updated', 'status', 'open', 'resolved', '2026-10-07 03:20:07'),
(248, 29, 13, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 03:15:26 GMT-0300 (hora estándar de Argentina)', '2026-10-08 06:15:26', '2026-10-07 03:20:07'),
(249, 29, 13, 'updated', 'sla_status', 'on_track', 'met', '2026-10-07 03:20:07'),
(250, 30, 5, 'created', 'type', NULL, 'incident', '2026-10-08 00:22:17'),
(251, 30, 5, 'created', 'status', NULL, 'open', '2026-10-08 00:22:17'),
(252, 30, 5, 'created', 'title', NULL, '666', '2026-10-08 00:22:17'),
(253, 30, 5, 'created', 'priority', NULL, 'medium', '2026-10-08 00:22:17'),
(254, 31, 5, 'created', 'type', NULL, 'incident', '2026-10-08 00:26:21'),
(255, 31, 5, 'created', 'status', NULL, 'open', '2026-10-08 00:26:21'),
(256, 31, 5, 'created', 'priority', NULL, 'medium', '2026-10-08 00:26:21'),
(257, 31, 5, 'created', 'title', NULL, 'Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.v3433Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.Pruebas.', '2026-10-08 00:26:21'),
(262, 33, 5, 'created', 'status', NULL, 'open', '2026-10-08 02:39:16'),
(263, 33, 5, 'created', 'type', NULL, 'incident', '2026-10-08 02:39:16'),
(264, 33, 5, 'created', 'priority', NULL, 'high', '2026-10-08 02:39:16'),
(265, 33, 5, 'created', 'title', NULL, 'WDW', '2026-10-08 02:39:16'),
(266, 31, 5, 'updated', 'technician_id', NULL, '9', '2026-10-08 04:00:42'),
(267, 31, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 04:26:21 GMT-0300 (hora estándar de Argentina)', '2026-10-08 07:26:21', '2026-10-08 04:00:42'),
(268, 31, 5, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 00:26:21 GMT-0300 (hora estándar de Argentina)', '2026-10-09 03:26:21', '2026-10-08 04:00:42'),
(269, 31, 5, 'updated', 'priority', 'medium', NULL, '2026-10-08 04:01:04'),
(270, 31, 5, 'updated', 'type', 'incident', 'requirement', '2026-10-08 04:01:04'),
(271, 31, 5, 'updated', 'sla_status', 'on_track', NULL, '2026-10-08 04:01:04'),
(272, 31, 5, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 03:26:21 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-08 04:01:04'),
(273, 31, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 07:26:21 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-08 04:01:04'),
(274, 31, 5, 'updated', 'priority', NULL, 'medium', '2026-10-08 04:01:07'),
(275, 31, 5, 'updated', 'sla_status', NULL, 'on_track', '2026-10-08 04:01:07'),
(276, 31, 5, 'updated', 'type', 'requirement', 'incident', '2026-10-08 04:01:07'),
(277, 31, 5, 'updated', 'sla_response_due', NULL, '2026-10-08 04:26:21', '2026-10-08 04:01:07'),
(278, 31, 5, 'updated', 'sla_resolution_due', NULL, '2026-10-09 00:26:21', '2026-10-08 04:01:07'),
(279, 31, 5, 'updated', 'priority', 'medium', NULL, '2026-10-08 04:01:09'),
(280, 31, 5, 'updated', 'type', 'incident', 'requirement', '2026-10-08 04:01:09'),
(281, 31, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 04:26:21 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-08 04:01:09'),
(282, 31, 5, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 00:26:21 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-08 04:01:09'),
(283, 31, 5, 'updated', 'sla_status', 'on_track', NULL, '2026-10-08 04:01:09'),
(284, 31, 5, 'updated', 'category', NULL, 'Otro', '2026-10-08 04:01:14'),
(285, 31, 5, 'updated', 'subcategory', NULL, 'Consulta general', '2026-10-08 04:01:17'),
(295, 34, 13, 'created', 'type', NULL, 'incident', '2026-10-08 17:45:08'),
(296, 34, 13, 'created', 'priority', NULL, 'medium', '2026-10-08 17:45:08'),
(297, 34, 13, 'created', 'status', NULL, 'open', '2026-10-08 17:45:08'),
(298, 34, 13, 'created', 'title', NULL, '444', '2026-10-08 17:45:08'),
(299, 33, 13, 'updated', 'status', 'open', 'resolved', '2026-10-08 22:45:00'),
(300, 33, 13, 'updated', 'sla_status', 'on_track', 'met', '2026-10-08 22:45:00'),
(301, 33, 13, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 10:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 13:39:16', '2026-10-08 22:45:00'),
(302, 33, 13, 'updated', 'sla_response_due', 'Thu Oct 08 2026 04:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 07:39:16', '2026-10-08 22:45:00'),
(303, 34, 5, 'updated', 'group_id', '1', '5', '2026-10-09 04:04:06'),
(304, 34, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 21:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 00:45:08', '2026-10-09 04:04:06'),
(305, 34, 5, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 17:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 20:45:08', '2026-10-09 04:04:06'),
(306, 34, 5, 'updated', 'sla_status', 'on_track', 'at_risk', '2026-10-09 04:04:06'),
(307, 34, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 00:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 03:45:08', '2026-10-09 04:05:27'),
(308, 34, 5, 'updated', 'group_id', '5', '1', '2026-10-09 04:05:27'),
(309, 34, 5, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 20:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 23:45:08', '2026-10-09 04:05:27'),
(310, 34, 5, 'updated', 'group_id', '1', '5', '2026-10-09 04:05:29'),
(311, 34, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 03:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 06:45:08', '2026-10-09 04:05:29'),
(312, 34, 5, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 23:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-10 02:45:08', '2026-10-09 04:05:29'),
(313, 34, 5, 'updated', 'sla_status', 'at_risk', 'on_track', '2026-10-09 04:05:29'),
(314, 34, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 06:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 09:45:08', '2026-10-09 04:05:32'),
(315, 34, 5, 'updated', 'group_id', '5', '3', '2026-10-09 04:05:32'),
(316, 34, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 02:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-10 05:45:08', '2026-10-09 04:05:32'),
(317, 34, 5, 'updated', 'group_id', '3', '4', '2026-10-09 04:05:42'),
(318, 34, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 09:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-09 12:45:08', '2026-10-09 04:05:42'),
(319, 34, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 05:45:08 GMT-0300 (hora estándar de Argentina)', '2026-10-10 08:45:08', '2026-10-09 04:05:42'),
(320, 25, 5, 'updated', 'group_id', '3', '1', '2026-10-09 04:06:01'),
(321, 25, 5, 'updated', 'group_id', '1', '3', '2026-10-09 04:06:11'),
(322, 25, 5, 'updated', 'group_id', '3', '5', '2026-10-09 04:06:18'),
(323, 25, 5, 'updated', 'group_id', '5', '3', '2026-10-09 04:06:23'),
(324, 25, 5, 'updated', 'group_id', '3', '4', '2026-10-09 04:06:28'),
(325, 25, 5, 'updated', 'group_id', '4', '2', '2026-10-09 04:06:32'),
(326, 25, 5, 'updated', 'group_id', '2', '5', '2026-10-09 04:06:40'),
(327, 25, 5, 'updated', 'group_id', '5', '1', '2026-10-09 04:06:41'),
(328, 33, 5, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 13:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 16:39:16', '2026-10-09 04:08:55'),
(329, 33, 5, 'updated', 'group_id', '1', '5', '2026-10-09 04:08:55'),
(330, 33, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 07:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 10:39:16', '2026-10-09 04:08:55'),
(331, 33, 5, 'updated', 'sla_status', 'met', 'breached', '2026-10-09 04:08:55'),
(332, 33, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 10:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 13:39:16', '2026-10-09 04:08:58'),
(333, 33, 5, 'updated', 'group_id', '5', '3', '2026-10-09 04:08:58'),
(334, 33, 5, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 16:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 19:39:16', '2026-10-09 04:08:58'),
(335, 33, 5, 'updated', 'group_id', '3', '4', '2026-10-09 04:09:03'),
(336, 33, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 13:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 16:39:16', '2026-10-09 04:09:03'),
(337, 33, 5, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 19:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 22:39:16', '2026-10-09 04:09:03'),
(338, 33, 5, 'updated', 'group_id', '4', '2', '2026-10-09 04:09:06'),
(339, 33, 5, 'updated', 'sla_response_due', 'Thu Oct 08 2026 16:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-08 19:39:16', '2026-10-09 04:09:06'),
(340, 33, 5, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 22:39:16 GMT-0300 (hora estándar de Argentina)', '2026-10-09 01:39:16', '2026-10-09 04:09:06'),
(344, 31, 13, 'updated', 'group_id', '1', '5', '2026-10-09 04:11:37'),
(345, 29, 13, 'updated', 'sla_response_due', 'Wed Oct 07 2026 10:15:26 GMT-0300 (hora estándar de Argentina)', '2026-10-07 13:15:26', '2026-10-09 04:11:45'),
(346, 29, 13, 'updated', 'group_id', '1', '3', '2026-10-09 04:11:45'),
(347, 29, 13, 'updated', 'sla_resolution_due', 'Thu Oct 08 2026 06:15:26 GMT-0300 (hora estándar de Argentina)', '2026-10-08 09:15:26', '2026-10-09 04:11:45'),
(348, 30, 21, 'updated', 'sla_response_due', 'Thu Oct 08 2026 04:22:17 GMT-0300 (hora estándar de Argentina)', '2026-10-08 07:22:17', '2026-10-09 04:19:48'),
(349, 30, 21, 'updated', 'group_id', '1', '4', '2026-10-09 04:19:48'),
(350, 30, 21, 'updated', 'sla_resolution_due', 'Fri Oct 09 2026 00:22:17 GMT-0300 (hora estándar de Argentina)', '2026-10-09 03:22:17', '2026-10-09 04:19:48'),
(351, 30, 21, 'updated', 'sla_status', 'on_track', 'breached', '2026-10-09 04:19:48'),
(352, 28, 21, 'updated', 'sla_response_due', 'Tue Sep 15 2026 02:41:18 GMT-0300 (hora estándar de Argentina)', '2026-09-15 05:41:18', '2026-10-09 04:19:57'),
(353, 28, 21, 'updated', 'group_id', '1', '5', '2026-10-09 04:19:57'),
(354, 28, 21, 'updated', 'sla_resolution_due', 'Tue Sep 15 2026 22:41:18 GMT-0300 (hora estándar de Argentina)', '2026-09-16 01:41:18', '2026-10-09 04:19:57'),
(355, 25, 21, 'updated', 'group_id', '1', '5', '2026-10-09 04:21:12'),
(359, 35, 5, 'created', 'type', NULL, 'incident', '2026-10-09 04:41:05'),
(360, 35, 5, 'created', 'status', NULL, 'open', '2026-10-09 04:41:05'),
(361, 35, 5, 'created', 'priority', NULL, 'medium', '2026-10-09 04:41:05'),
(362, 35, 5, 'created', 'title', NULL, 'Problemas', '2026-10-09 04:41:05'),
(363, 21, 5, 'updated', 'group_id', '1', '3', '2026-10-09 05:22:38'),
(364, 21, 5, 'updated', 'sla_response_due', 'Sun Jul 19 2026 02:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-19 05:52:54', '2026-10-09 05:22:38'),
(365, 21, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 22:52:54 GMT-0300 (hora estándar de Argentina)', '2026-07-20 01:52:54', '2026-10-09 05:22:38'),
(370, 36, 12, 'created', 'type', NULL, 'incident', '2026-10-09 05:38:11'),
(371, 36, 12, 'created', 'status', NULL, 'open', '2026-10-09 05:38:11'),
(372, 36, 12, 'created', 'priority', NULL, 'medium', '2026-10-09 05:38:11'),
(373, 36, 12, 'created', 'title', NULL, 'PRUEBA CAMPO DESCRIPCION', '2026-10-09 05:38:11'),
(374, 36, 12, 'updated', 'description', '<p>pr<strong>ueba</strong><span style=\"color: rgb(255, 0, 0);\"><strong> fffsfsfsf</strong></span><span style=\"color: rgb(0, 0, 0);\"><strong><mark data-color=\"#ff0000\" style=\"background-color: rgb(255, 0, 0); color: inherit;\">dsffsdfsdf</mark></strong></span></p>', '<p>pr<strong>ueba</strong><span style=\"color: rgb(255, 0, 0);\"><strong> fffsfsfsf</strong></span><span style=\"color: rgb(0, 0, 0);\"><strong><mark data-color=\"#ff0000\" style=\"background-color: rgb(255, 0, 0); color: inherit;\">dsffsdfsdf</mark></strong></span></p><img data-attachment-id=\"5\">', '2026-10-09 05:38:11'),
(375, 36, 12, 'updated', 'sla_response_due', 'Fri Oct 09 2026 09:38:11 GMT-0300 (hora estándar de Argentina)', '2026-10-09 12:38:11', '2026-10-09 05:38:11'),
(376, 36, 12, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 05:38:11 GMT-0300 (hora estándar de Argentina)', '2026-10-10 08:38:11', '2026-10-09 05:38:11'),
(377, 37, 5, 'created', 'type', NULL, 'incident', '2026-10-09 05:40:03'),
(378, 37, 5, 'created', 'status', NULL, 'open', '2026-10-09 05:40:03'),
(379, 37, 5, 'created', 'priority', NULL, 'medium', '2026-10-09 05:40:03'),
(380, 37, 5, 'created', 'title', NULL, 'FFFFF', '2026-10-09 05:40:03'),
(381, 37, 5, 'updated', 'description', '<p><strong>FSDFSDFSDFSDF</strong></p>', '<p><strong>FSDFSDFSDFSDF</strong></p><img data-attachment-id=\"6\" />', '2026-10-09 05:42:59'),
(382, 37, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 09:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-09 09:40:03', '2026-10-09 05:42:59'),
(383, 37, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 05:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 05:40:03', '2026-10-09 05:42:59'),
(384, 37, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 09:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-09 12:40:03', '2026-10-09 06:41:39'),
(385, 37, 5, 'updated', 'technician_id', NULL, '9', '2026-10-09 06:41:39'),
(386, 37, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 05:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 08:40:03', '2026-10-09 06:41:39'),
(387, 37, 13, 'updated', 'status', 'open', 'resolved', '2026-10-09 16:01:33'),
(388, 37, 13, 'updated', 'resolution', NULL, 'Probaste reiniciar?', '2026-10-09 16:01:33'),
(389, 37, 13, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 11:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 14:40:03', '2026-10-09 16:04:01'),
(390, 37, 13, 'updated', 'sla_response_due', 'Fri Oct 09 2026 15:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-09 18:40:03', '2026-10-09 16:04:01'),
(391, 37, 13, 'updated', 'status', 'resolved', 'open', '2026-10-09 16:04:01'),
(392, 37, 13, 'updated', 'sla_status', 'met', 'on_track', '2026-10-09 16:04:01'),
(393, 37, 5, 'updated', 'status', 'open', 'resolved', '2026-10-09 16:51:44'),
(394, 37, 5, 'updated', 'resolution', NULL, 'Probaste reiniciar?', '2026-10-09 16:51:44'),
(395, 38, 5, 'created', 'status', NULL, 'open', '2026-10-09 16:53:25'),
(396, 38, 5, 'created', 'type', NULL, 'incident', '2026-10-09 16:53:25'),
(397, 38, 5, 'created', 'priority', NULL, 'medium', '2026-10-09 16:53:25'),
(398, 38, 5, 'created', 'title', NULL, 'No funca', '2026-10-09 16:53:25'),
(399, 38, 5, 'updated', 'description', '<p><strong>fdffsFSDFSDFA<em>FSFSDFFSDFSAAFSDAF<u>FSDFSDAFSSDAFSDAFSA</u></em></strong></p><p></p>', '<p><strong>fdffsFSDFSDFA<em>FSFSDFFSDFSAAFSDAF<u>FSDFSDAFSSDAFSDAFSA</u></em></strong></p><p></p><img data-attachment-id=\"7\" />', '2026-10-09 16:53:25'),
(400, 38, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 20:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-09 23:53:25', '2026-10-09 16:53:25'),
(401, 38, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 16:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 19:53:25', '2026-10-09 16:53:25'),
(402, 38, 5, 'updated', 'category', NULL, 'Hardware', '2026-10-09 16:53:39'),
(403, 38, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 23:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 02:53:25', '2026-10-09 16:53:39'),
(404, 38, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 19:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 22:53:25', '2026-10-09 16:53:39'),
(405, 38, 5, 'updated', 'subcategory', NULL, 'Impresora', '2026-10-09 16:53:42'),
(406, 38, 5, 'updated', 'sla_response_due', 'Sat Oct 10 2026 02:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 05:53:25', '2026-10-09 16:53:42'),
(407, 38, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 22:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-11 01:53:25', '2026-10-09 16:53:42'),
(408, 38, 5, 'updated', 'sla_response_due', 'Sat Oct 10 2026 05:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 08:53:25', '2026-10-09 16:53:52'),
(409, 38, 5, 'updated', 'group_id', '1', '2', '2026-10-09 16:53:52'),
(410, 38, 5, 'updated', 'sla_resolution_due', 'Sun Oct 11 2026 01:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-11 04:53:25', '2026-10-09 16:53:52'),
(411, 38, 5, 'updated', 'sla_response_due', 'Sat Oct 10 2026 08:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 11:53:25', '2026-10-09 16:53:57'),
(412, 38, 5, 'updated', 'technician_id', NULL, '9', '2026-10-09 16:53:57'),
(413, 38, 5, 'updated', 'sla_resolution_due', 'Sun Oct 11 2026 04:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-11 07:53:25', '2026-10-09 16:53:57'),
(414, 36, 5, 'updated', 'status', 'open', 'resolved', '2026-10-15 18:40:22'),
(415, 36, 5, 'updated', 'resolution', NULL, 'Probaste reiniciar?', '2026-10-15 18:40:22'),
(416, 36, 5, 'updated', 'status', 'resolved', 'open', '2026-10-15 18:40:30'),
(417, 36, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 15:38:11 GMT-0300 (hora estándar de Argentina)', '2026-10-09 18:38:11', '2026-10-15 18:40:30'),
(418, 36, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 11:38:11 GMT-0300 (hora estándar de Argentina)', '2026-10-10 14:38:11', '2026-10-15 18:40:30'),
(419, 36, 5, 'updated', 'sla_status', 'met', 'breached', '2026-10-15 18:40:30'),
(420, 37, 5, 'updated', 'status', 'resolved', 'open', '2026-10-15 20:40:17'),
(421, 37, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 17:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 20:40:03', '2026-10-15 20:40:17'),
(422, 37, 5, 'updated', 'sla_response_due', 'Fri Oct 09 2026 21:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 00:40:03', '2026-10-15 20:40:17'),
(423, 37, 5, 'updated', 'sla_status', 'met', 'breached', '2026-10-15 20:40:17'),
(424, 37, 5, 'updated', 'status', 'open', 'resolved', '2026-10-15 20:43:08'),
(425, 37, 5, 'updated', 'resolution', NULL, '<p>Prueba imagen</p><p> </p><img data-attachment-id=\"10\" /><p></p>', '2026-10-15 20:43:08'),
(426, 38, 5, 'updated', 'status', 'open', 'resolved', '2026-10-15 21:20:44'),
(427, 38, 5, 'updated', 'resolution', NULL, '<p>Prueba imagen</p>', '2026-10-15 21:20:44'),
(428, 38, 5, 'updated', 'status', 'resolved', 'open', '2026-10-15 21:20:46'),
(429, 38, 5, 'updated', 'sla_response_due', 'Sat Oct 10 2026 14:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-10 17:53:25', '2026-10-15 21:20:46'),
(430, 38, 5, 'updated', 'sla_resolution_due', 'Sun Oct 11 2026 10:53:25 GMT-0300 (hora estándar de Argentina)', '2026-10-11 13:53:25', '2026-10-15 21:20:46'),
(431, 38, 5, 'updated', 'sla_status', 'met', 'breached', '2026-10-15 21:20:46'),
(432, 37, 5, 'updated', 'status', 'resolved', 'open', '2026-10-15 21:44:39'),
(433, 37, 5, 'updated', 'sla_response_due', 'Sat Oct 10 2026 03:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 06:40:03', '2026-10-15 21:44:39'),
(434, 37, 5, 'updated', 'sla_resolution_due', 'Sat Oct 10 2026 23:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-11 02:40:03', '2026-10-15 21:44:39'),
(435, 37, 5, 'updated', 'status', 'open', 'resolved', '2026-10-15 21:44:45'),
(436, 37, 5, 'updated', 'resolution', NULL, '<p>Prueba imagen</p><img data-attachment-id=\"12\" />', '2026-10-15 21:44:45'),
(437, 37, 5, 'updated', 'group_id', '1', '6', '2026-10-15 22:38:45'),
(438, 37, 5, 'updated', 'sla_resolution_due', 'Sun Oct 11 2026 05:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-11 08:40:03', '2026-10-15 22:38:45'),
(439, 37, 5, 'updated', 'sla_response_due', 'Sat Oct 10 2026 09:40:03 GMT-0300 (hora estándar de Argentina)', '2026-10-10 12:40:03', '2026-10-15 22:38:45'),
(440, 39, 24, 'created', 'type', NULL, 'incident', '2026-10-19 15:33:59'),
(441, 39, 24, 'created', 'status', NULL, 'open', '2026-10-19 15:33:59'),
(442, 39, 24, 'created', 'priority', NULL, 'medium', '2026-10-19 15:33:59'),
(443, 39, 24, 'created', 'title', NULL, 'Prueba ticket usuario VISTA', '2026-10-19 15:33:59'),
(444, 39, 5, 'updated', 'status', 'open', 'resolved', '2026-10-22 03:15:48'),
(445, 39, 5, 'updated', 'sla_status', 'on_track', 'met', '2026-10-22 03:15:48'),
(446, 39, 5, 'updated', 'sla_response_due', 'Mon Oct 19 2026 19:33:59 GMT-0300 (hora estándar de Argentina)', '2026-10-19 22:33:59', '2026-10-22 03:15:48'),
(447, 39, 5, 'updated', 'sla_resolution_due', 'Tue Oct 20 2026 15:33:59 GMT-0300 (hora estándar de Argentina)', '2026-10-20 18:33:59', '2026-10-22 03:15:48'),
(448, 40, 16, 'created', 'type', NULL, 'incident', '2026-10-22 04:02:38'),
(449, 40, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:02:38'),
(450, 40, 16, 'created', 'priority', NULL, 'medium', '2026-10-22 04:02:38'),
(451, 40, 16, 'created', 'title', NULL, 'Problemas con DNS', '2026-10-22 04:02:38'),
(452, 41, 16, 'created', 'type', NULL, 'requirement', '2026-10-22 04:03:11'),
(453, 41, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:03:11'),
(454, 41, 16, 'created', 'title', NULL, 'Grant en BBDD', '2026-10-22 04:03:11'),
(455, 42, 16, 'created', 'type', NULL, 'incident', '2026-10-22 04:03:45'),
(456, 42, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:03:45'),
(457, 42, 16, 'created', 'priority', NULL, 'medium', '2026-10-22 04:03:45'),
(458, 42, 16, 'created', 'title', NULL, 'Corte de Fibra Optica por poda', '2026-10-22 04:03:45'),
(459, 43, 16, 'created', 'type', NULL, 'incident', '2026-10-22 04:04:16'),
(460, 43, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:04:16'),
(461, 43, 16, 'created', 'priority', NULL, 'medium', '2026-10-22 04:04:16'),
(462, 43, 16, 'created', 'title', NULL, 'Problemas repositorio HML', '2026-10-22 04:04:16'),
(463, 44, 16, 'created', 'priority', NULL, 'medium', '2026-10-22 04:04:36'),
(464, 44, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:04:36'),
(465, 44, 16, 'created', 'type', NULL, 'incident', '2026-10-22 04:04:36'),
(466, 44, 16, 'created', 'title', NULL, 'Acceso carpeta compartida', '2026-10-22 04:04:36'),
(467, 45, 16, 'created', 'type', NULL, 'requirement', '2026-10-22 04:05:27'),
(468, 45, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:05:27'),
(469, 45, 16, 'created', 'title', NULL, 'Formateo notebook', '2026-10-22 04:05:27'),
(470, 46, 16, 'created', 'status', NULL, 'open', '2026-10-22 04:06:04'),
(471, 46, 16, 'created', 'priority', NULL, 'medium', '2026-10-22 04:06:04'),
(472, 46, 16, 'created', 'type', NULL, 'incident', '2026-10-22 04:06:04'),
(473, 46, 16, 'created', 'title', NULL, 'Aumento almacenamiento de VM', '2026-10-22 04:06:04'),
(499, 45, 5, 'updated', 'status', 'open', 'resolved', '2026-10-23 03:59:20'),
(500, 45, 5, 'updated', 'resolution', NULL, '<p>ffsdfsdf</p>', '2026-10-23 03:59:20'),
(501, 45, 5, 'updated', 'technician_id', NULL, '9', '2026-10-23 04:42:23'),
(502, 45, 5, 'updated', 'category', NULL, 'Software', '2026-10-23 04:42:23'),
(503, 45, 5, 'updated', 'subcategory', NULL, 'Sistema operativo', '2026-10-23 04:42:23'),
(504, 45, 5, 'updated', 'type', 'requirement', 'incident', '2026-10-23 04:42:43');
INSERT INTO `ticket_history` (`id`, `ticket_id`, `user_id`, `action`, `field_name`, `old_value`, `new_value`, `created_at`) VALUES
(505, 45, 5, 'updated', 'priority', NULL, 'medium', '2026-10-23 04:42:43'),
(506, 45, 5, 'updated', 'sla_response_due', NULL, '2026-10-22 08:05:27', '2026-10-23 04:42:43'),
(507, 45, 5, 'updated', 'sla_status', NULL, 'breached', '2026-10-23 04:42:43'),
(508, 45, 5, 'updated', 'sla_resolution_due', NULL, '2026-10-23 04:05:27', '2026-10-23 04:42:43'),
(509, 45, 5, 'updated', 'category', 'Software', NULL, '2026-10-23 04:43:48'),
(510, 45, 5, 'updated', 'technician_id', '9', NULL, '2026-10-23 04:43:48'),
(511, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:05:27', '2026-10-23 04:43:48'),
(512, 45, 5, 'updated', 'subcategory', 'Sistema operativo', NULL, '2026-10-23 04:43:48'),
(513, 45, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:05:27', '2026-10-23 04:43:48'),
(514, 45, 5, 'updated', 'status', 'resolved', 'open', '2026-10-23 04:43:59'),
(515, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:05:27', '2026-10-23 04:43:59'),
(516, 45, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:05:27', '2026-10-23 04:43:59'),
(517, 45, 5, 'updated', 'status', 'open', 'on-hold', '2026-10-23 04:44:06'),
(518, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 11:05:27', '2026-10-23 04:44:06'),
(519, 45, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-23 07:05:27', '2026-10-23 04:44:06'),
(520, 45, 5, 'updated', 'sla_paused_at', NULL, '2026-10-23 04:44:06', '2026-10-23 04:44:06'),
(521, 45, 5, 'updated', 'sla_status', 'breached', 'paused', '2026-10-23 04:44:06'),
(522, 46, 5, 'updated', 'description', '<p style=\"text-align:right\">Aumento almacenamiento de VMAumento almacenamiento de VM</p>', '<p style=\"text-align:left\">Aumento almacenamiento de VMAumento almacenamiento de VM</p>', '2026-10-23 14:33:20'),
(523, 46, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:06:04 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:06:04', '2026-10-23 14:33:20'),
(524, 46, 5, 'updated', 'sla_status', 'on_track', 'breached', '2026-10-23 14:33:20'),
(525, 46, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:06:04 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:06:04', '2026-10-23 14:33:20'),
(526, 48, 5, 'created', 'type', NULL, 'requirement', '2026-10-23 18:12:51'),
(527, 48, 5, 'created', 'title', NULL, 'Agregar disco SSD a notebook', '2026-10-23 18:12:51'),
(528, 48, 5, 'created', 'status', NULL, 'open', '2026-10-23 18:12:51'),
(529, 48, 5, 'updated', 'status', 'open', 'in-progress', '2026-10-23 18:16:38'),
(530, 48, 5, 'updated', 'status', 'in-progress', 'on-hold', '2026-10-23 18:16:40'),
(531, 48, 5, 'updated', 'status', 'on-hold', 'resolved', '2026-10-23 18:16:42'),
(532, 48, 5, 'updated', 'status', 'resolved', 'open', '2026-10-23 18:16:44'),
(533, 45, 5, 'updated', 'status', 'on-hold', 'in-progress', '2026-10-23 18:55:03'),
(534, 45, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 07:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:05:27', '2026-10-23 18:55:03'),
(535, 45, 5, 'updated', 'sla_status', 'paused', 'breached', '2026-10-23 18:55:03'),
(536, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 11:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:05:27', '2026-10-23 18:55:03'),
(537, 45, 5, 'updated', 'sla_paused_at', 'Fri Oct 23 2026 04:44:06 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 18:55:03'),
(538, 45, 5, 'updated', 'priority', 'medium', 'low', '2026-10-23 18:55:19'),
(539, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 12:05:27', '2026-10-23 18:55:19'),
(540, 45, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-24 04:05:27', '2026-10-23 18:55:19'),
(541, 45, 5, 'updated', 'sla_status', 'breached', 'at_risk', '2026-10-23 18:55:19'),
(542, 45, 5, 'updated', 'priority', 'low', 'high', '2026-10-23 18:55:24'),
(543, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 12:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 06:05:27', '2026-10-23 18:55:24'),
(544, 45, 5, 'updated', 'sla_status', 'at_risk', 'breached', '2026-10-23 18:55:24'),
(545, 45, 5, 'updated', 'sla_resolution_due', 'Sat Oct 24 2026 04:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 12:05:27', '2026-10-23 18:55:24'),
(546, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 06:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 06:05:27', '2026-10-23 19:01:03'),
(547, 45, 5, 'updated', 'sla_resolution_due', 'Thu Oct 22 2026 12:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 12:05:27', '2026-10-23 19:01:03'),
(548, 48, 5, 'updated', 'description', '<p>Agregar disco SSD a notebook</p>', '<p>Agregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebook</p>', '2026-10-23 20:07:52'),
(549, 48, 5, 'updated', 'description', '<p>Agregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebook</p>', '<p>Agregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebook</p>', '2026-10-23 20:07:59'),
(550, 48, 5, 'updated', 'description', '<p>Agregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebookAgregar disco SSD a notebook</p>', '<p>Agregar disco SSD a notebook</p>', '2026-10-23 20:11:52'),
(551, 48, 5, 'updated', 'category', NULL, 'Hardware', '2026-10-23 20:51:04'),
(552, 48, 5, 'updated', 'technician_id', NULL, '9', '2026-10-23 20:51:04'),
(553, 48, 5, 'updated', 'subcategory', NULL, 'Computadora / Notebook', '2026-10-23 20:51:04'),
(554, 48, 5, 'updated', 'status', 'open', 'resolved', '2026-10-23 20:51:04'),
(555, 48, 5, 'updated', 'resolution', NULL, '<p>resuelto</p>', '2026-10-23 20:51:04'),
(556, 46, 5, 'updated', 'technician_id', NULL, '21', '2026-10-23 21:03:20'),
(557, 46, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:06:04 GMT-0300 (hora estándar de Argentina)', '2026-10-22 11:06:04', '2026-10-23 21:03:20'),
(558, 46, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:06:04 GMT-0300 (hora estándar de Argentina)', '2026-10-23 07:06:04', '2026-10-23 21:03:20'),
(559, 43, 5, 'updated', 'group_id', '1', '3', '2026-10-23 21:05:06'),
(560, 43, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:04:16 GMT-0300 (hora estándar de Argentina)', '2026-10-22 11:04:16', '2026-10-23 21:05:06'),
(561, 43, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:04:16 GMT-0300 (hora estándar de Argentina)', '2026-10-23 07:04:16', '2026-10-23 21:05:06'),
(562, 43, 5, 'updated', 'sla_status', 'on_track', 'breached', '2026-10-23 21:05:06'),
(563, 41, 5, 'updated', 'group_id', '1', '6', '2026-10-23 21:09:43'),
(564, 19, 5, 'updated', 'group_id', '1', '3', '2026-10-23 21:09:53'),
(565, 19, 5, 'updated', 'technician_id', '9', NULL, '2026-10-23 21:09:53'),
(566, 19, 5, 'updated', 'sla_response_due', 'Sat Jul 18 2026 19:28:46 GMT-0300 (hora estándar de Argentina)', '2026-07-18 22:28:46', '2026-10-23 21:09:53'),
(567, 19, 5, 'updated', 'sla_resolution_due', 'Sun Jul 19 2026 15:28:46 GMT-0300 (hora estándar de Argentina)', '2026-07-19 18:28:46', '2026-10-23 21:09:53'),
(568, 19, 5, 'updated', 'sla_status', 'on_track', 'breached', '2026-10-23 21:09:53'),
(569, 45, 5, 'updated', 'priority', 'high', 'low', '2026-10-23 21:21:39'),
(570, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 06:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 12:05:27', '2026-10-23 21:21:39'),
(571, 45, 5, 'updated', 'sla_resolution_due', 'Thu Oct 22 2026 12:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-24 04:05:27', '2026-10-23 21:21:39'),
(572, 45, 5, 'updated', 'sla_status', 'breached', 'at_risk', '2026-10-23 21:21:39'),
(573, 45, 5, 'updated', 'status', 'in-progress', 'on-hold', '2026-10-23 21:21:47'),
(574, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 12:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 15:05:27', '2026-10-23 21:21:47'),
(575, 45, 5, 'updated', 'sla_resolution_due', 'Sat Oct 24 2026 04:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-24 07:05:27', '2026-10-23 21:21:47'),
(576, 45, 5, 'updated', 'sla_paused_at', NULL, '2026-10-23 21:21:47', '2026-10-23 21:21:47'),
(577, 45, 5, 'updated', 'sla_status', 'at_risk', 'paused', '2026-10-23 21:21:47'),
(578, 45, 5, 'updated', 'subcategory', NULL, 'Computadora / Notebook', '2026-10-23 21:22:00'),
(579, 45, 5, 'updated', 'category', NULL, 'Hardware', '2026-10-23 21:22:00'),
(580, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 15:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-22 18:05:27', '2026-10-23 21:22:00'),
(581, 45, 5, 'updated', 'sla_resolution_due', 'Sat Oct 24 2026 07:05:27 GMT-0300 (hora estándar de Argentina)', '2026-10-24 10:05:27', '2026-10-23 21:22:00'),
(582, 45, 5, 'updated', 'sla_paused_at', 'Fri Oct 23 2026 21:21:47 GMT-0300 (hora estándar de Argentina)', '2026-10-24 00:21:47', '2026-10-23 21:22:00'),
(583, 44, 5, 'updated', 'type', 'incident', 'requirement', '2026-10-23 21:24:30'),
(584, 44, 5, 'updated', 'priority', 'medium', NULL, '2026-10-23 21:24:30'),
(585, 44, 5, 'updated', 'title', 'Acceso carpeta compartida ', 'Acceso carpeta compartida', '2026-10-23 21:24:30'),
(586, 44, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:04:36 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:30'),
(587, 44, 5, 'updated', 'sla_status', 'on_track', NULL, '2026-10-23 21:24:30'),
(588, 44, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:04:36 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:30'),
(589, 45, 5, 'updated', 'type', 'incident', 'requirement', '2026-10-23 21:24:39'),
(590, 45, 5, 'updated', 'priority', 'low', NULL, '2026-10-23 21:24:39'),
(591, 45, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 18:05:27 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:39'),
(592, 45, 5, 'updated', 'sla_resolution_due', 'Sat Oct 24 2026 10:05:27 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:39'),
(593, 45, 5, 'updated', 'sla_status', 'paused', NULL, '2026-10-23 21:24:39'),
(594, 45, 5, 'updated', 'sla_paused_at', 'Sat Oct 24 2026 00:21:47 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:39'),
(595, 46, 5, 'updated', 'type', 'incident', 'requirement', '2026-10-23 21:24:51'),
(596, 46, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 11:06:04 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:51'),
(597, 46, 5, 'updated', 'priority', 'medium', NULL, '2026-10-23 21:24:51'),
(598, 46, 5, 'updated', 'sla_status', 'breached', NULL, '2026-10-23 21:24:51'),
(599, 46, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 07:06:04 GMT-0300 (hora estándar de Argentina)', NULL, '2026-10-23 21:24:51'),
(600, 45, 13, 'updated', 'technician_id', NULL, '13', '2026-10-23 21:27:30'),
(601, 40, 13, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-22 11:02:38', '2026-10-23 21:27:56'),
(602, 40, 13, 'updated', 'group_id', '1', '3', '2026-10-23 21:27:56'),
(603, 40, 13, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-23 07:02:38', '2026-10-23 21:27:56'),
(604, 40, 13, 'updated', 'sla_status', 'on_track', 'breached', '2026-10-23 21:27:56'),
(605, 7, 20, 'updated', 'group_id', '3', '7', '2026-10-23 21:28:56'),
(606, 7, 20, 'updated', 'sla_resolution_due', 'Sat Jun 20 2026 06:18:03 GMT-0300 (hora estándar de Argentina)', '2026-06-20 09:18:03', '2026-10-23 21:28:56'),
(607, 7, 20, 'updated', 'sla_response_due', 'Fri Jun 19 2026 10:18:03 GMT-0300 (hora estándar de Argentina)', '2026-06-19 13:18:03', '2026-10-23 21:28:56'),
(608, 40, 20, 'updated', 'category', NULL, 'Hardware', '2026-10-23 21:38:34'),
(609, 40, 20, 'updated', 'subcategory', NULL, 'Proyector', '2026-10-23 21:38:34'),
(610, 40, 20, 'updated', 'technician_id', NULL, '23', '2026-10-23 21:38:34'),
(611, 40, 20, 'updated', 'sla_response_due', 'Thu Oct 22 2026 11:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:02:38', '2026-10-23 21:38:34'),
(612, 40, 20, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 07:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:02:38', '2026-10-23 21:38:34'),
(613, 40, 20, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:02:38', '2026-10-23 21:38:46'),
(614, 40, 20, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:02:38', '2026-10-23 21:38:46'),
(615, 40, 20, 'updated', 'resolution', NULL, '<p>Resuelto</p>', '2026-10-23 21:38:55'),
(616, 40, 20, 'updated', 'status', 'open', 'resolved', '2026-10-23 21:38:55'),
(617, 40, 20, 'updated', 'status', 'resolved', 'open', '2026-10-23 21:39:07'),
(618, 40, 20, 'updated', 'sla_response_due', 'Thu Oct 22 2026 11:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-22 08:02:38', '2026-10-23 21:39:07'),
(619, 40, 20, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 07:02:38 GMT-0300 (hora estándar de Argentina)', '2026-10-23 04:02:38', '2026-10-23 21:39:07'),
(620, 45, 13, 'updated', 'group_id', '1', '2', '2026-10-26 03:35:23'),
(621, 45, 13, 'updated', 'technician_id', '13', NULL, '2026-10-26 03:35:23'),
(622, 44, 5, 'updated', 'status', 'open', 'in-progress', '2026-10-26 03:37:18'),
(623, 42, 5, 'updated', 'status', 'open', 'on-hold', '2026-10-26 03:37:22'),
(624, 42, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 08:03:45 GMT-0300 (hora estándar de Argentina)', '2026-10-22 11:03:45', '2026-10-26 03:37:22'),
(625, 42, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 04:03:45 GMT-0300 (hora estándar de Argentina)', '2026-10-23 07:03:45', '2026-10-26 03:37:22'),
(626, 42, 5, 'updated', 'sla_paused_at', NULL, '2026-10-26 03:37:22', '2026-10-26 03:37:22'),
(627, 42, 5, 'updated', 'sla_status', 'on_track', 'paused', '2026-10-26 03:37:22'),
(628, 44, 5, 'updated', 'category', NULL, 'Software', '2026-10-26 03:39:27'),
(629, 44, 5, 'updated', 'subcategory', NULL, 'Otro', '2026-10-26 03:39:27'),
(630, 44, 5, 'updated', 'technician_id', NULL, '13', '2026-10-26 03:39:27'),
(631, 44, 5, 'updated', 'status', 'in-progress', 'resolved', '2026-10-26 03:39:27'),
(632, 44, 5, 'updated', 'resolution', NULL, '<p>resuelto</p>', '2026-10-26 03:39:27'),
(633, 44, 5, 'updated', 'status', 'resolved', 'open', '2026-10-26 03:39:41'),
(634, 49, 5, 'created', 'type', NULL, 'requirement', '2026-10-26 03:54:35'),
(635, 49, 5, 'created', 'title', NULL, 'Grant en MariaDB', '2026-10-26 03:54:35'),
(636, 49, 5, 'created', 'status', NULL, 'open', '2026-10-26 03:54:35'),
(637, 50, 12, 'created', 'type', NULL, 'incident', '2026-10-26 03:55:00'),
(638, 50, 12, 'created', 'status', NULL, 'open', '2026-10-26 03:55:00'),
(639, 50, 12, 'created', 'priority', NULL, 'medium', '2026-10-26 03:55:00'),
(640, 50, 12, 'created', 'title', NULL, 'No me abre el correo', '2026-10-26 03:55:00'),
(641, 51, 5, 'created', 'status', NULL, 'open', '2026-10-26 05:58:16'),
(642, 51, 5, 'created', 'type', NULL, 'incident', '2026-10-26 05:58:16'),
(643, 51, 5, 'created', 'title', NULL, '123', '2026-10-26 05:58:16'),
(644, 51, 5, 'created', 'priority', NULL, 'medium', '2026-10-26 05:58:16'),
(645, 25, 27, 'updated', 'technician_id', NULL, '27', '2026-10-26 06:07:32'),
(646, 52, 5, 'created', 'type', NULL, 'incident', '2026-10-26 18:52:32'),
(647, 52, 5, 'created', 'title', NULL, 'Todo el edificio sin internet', '2026-10-26 18:52:32'),
(648, 52, 5, 'created', 'priority', NULL, 'high', '2026-10-26 18:52:32'),
(649, 52, 5, 'created', 'status', NULL, 'open', '2026-10-26 18:52:32'),
(650, 52, 5, 'updated', 'sla_response_due', 'Mon Oct 26 2026 20:52:32 GMT-0300 (hora estándar de Argentina)', '2026-10-26 23:52:32', '2026-10-27 01:10:01'),
(651, 52, 5, 'updated', 'sla_resolution_due', 'Tue Oct 27 2026 02:52:32 GMT-0300 (hora estándar de Argentina)', '2026-10-27 05:52:32', '2026-10-27 01:10:01'),
(652, 52, 5, 'updated', 'sla_paused_at', NULL, '2026-10-27 01:10:01', '2026-10-27 01:10:01'),
(653, 52, 5, 'updated', 'sla_status', 'on_track', 'paused', '2026-10-27 01:10:01'),
(654, 52, 5, 'updated', 'status', 'open', 'on-hold', '2026-10-27 01:10:01'),
(655, 50, 5, 'updated', 'sla_response_due', 'Mon Oct 26 2026 07:55:00 GMT-0300 (hora estándar de Argentina)', '2026-10-26 10:55:00', '2026-10-27 01:10:11'),
(656, 50, 5, 'updated', 'status', 'open', 'on-hold', '2026-10-27 01:10:11'),
(657, 50, 5, 'updated', 'sla_resolution_due', 'Tue Oct 27 2026 03:55:00 GMT-0300 (hora estándar de Argentina)', '2026-10-27 06:55:00', '2026-10-27 01:10:11'),
(658, 50, 5, 'updated', 'sla_paused_at', NULL, '2026-10-27 01:10:11', '2026-10-27 01:10:11'),
(659, 50, 5, 'updated', 'sla_status', 'on_track', 'paused', '2026-10-27 01:10:11'),
(660, 43, 5, 'updated', 'sla_response_due', 'Thu Oct 22 2026 11:04:16 GMT-0300 (hora estándar de Argentina)', '2026-10-22 14:04:16', '2026-10-27 01:10:15'),
(661, 43, 5, 'updated', 'status', 'open', 'on-hold', '2026-10-27 01:10:15'),
(662, 43, 5, 'updated', 'sla_resolution_due', 'Fri Oct 23 2026 07:04:16 GMT-0300 (hora estándar de Argentina)', '2026-10-23 10:04:16', '2026-10-27 01:10:15'),
(663, 43, 5, 'updated', 'sla_paused_at', NULL, '2026-10-27 01:10:15', '2026-10-27 01:10:15'),
(664, 43, 5, 'updated', 'sla_status', 'breached', 'paused', '2026-10-27 01:10:15'),
(665, 53, 12, 'created', 'type', NULL, 'requirement', '2026-10-27 04:10:16'),
(666, 53, 12, 'created', 'status', NULL, 'open', '2026-10-27 04:10:16'),
(667, 53, 12, 'created', 'title', NULL, 'Deploy PRD', '2026-10-27 04:10:16'),
(668, 54, 29, 'created', 'type', NULL, 'requirement', '2026-10-27 19:52:23'),
(669, 54, 29, 'created', 'title', NULL, 'Heavy Duty', '2026-10-27 19:52:23'),
(670, 54, 29, 'created', 'status', NULL, 'open', '2026-10-27 19:52:23'),
(671, 55, 5, 'created', 'type', NULL, 'incident', '2026-10-27 20:11:41'),
(672, 55, 5, 'created', 'status', NULL, 'open', '2026-10-27 20:11:41'),
(673, 55, 5, 'created', 'priority', NULL, 'medium', '2026-10-27 20:11:41'),
(674, 55, 5, 'created', 'title', NULL, 'Cambio de bateria notebook', '2026-10-27 20:11:41');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_reads`
--

CREATE TABLE `ticket_reads` (
  `user_id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `read_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_reads`
--

INSERT INTO `ticket_reads` (`user_id`, `ticket_id`, `read_at`) VALUES
(1, 6, '2026-10-26 03:50:53'),
(1, 7, '2026-10-26 03:50:53'),
(1, 8, '2026-10-26 03:50:53'),
(1, 10, '2026-10-26 03:50:53'),
(1, 11, '2026-10-26 03:50:53'),
(1, 12, '2026-10-26 03:50:53'),
(1, 13, '2026-10-26 03:50:53'),
(1, 15, '2026-10-26 03:50:53'),
(1, 16, '2026-10-26 03:50:53'),
(1, 17, '2026-10-26 03:50:53'),
(1, 19, '2026-10-26 03:50:53'),
(1, 21, '2026-10-26 03:50:53'),
(1, 23, '2026-10-26 03:50:53'),
(1, 24, '2026-10-26 03:50:53'),
(1, 25, '2026-10-26 03:50:53'),
(1, 26, '2026-10-26 03:50:53'),
(1, 28, '2026-10-26 03:50:53'),
(1, 29, '2026-10-26 03:50:53'),
(1, 30, '2026-10-26 03:50:53'),
(1, 31, '2026-10-26 03:50:53'),
(1, 33, '2026-10-26 03:50:53'),
(1, 34, '2026-10-26 03:50:53'),
(1, 35, '2026-10-26 03:50:53'),
(1, 36, '2026-10-26 03:50:53'),
(1, 37, '2026-10-26 03:50:53'),
(1, 38, '2026-10-26 03:50:53'),
(1, 39, '2026-10-26 03:50:53'),
(1, 40, '2026-10-26 03:50:53'),
(1, 41, '2026-10-26 03:50:53'),
(1, 42, '2026-10-26 03:50:53'),
(1, 43, '2026-10-26 03:50:53'),
(1, 44, '2026-10-26 03:50:53'),
(1, 45, '2026-10-26 03:50:53'),
(1, 46, '2026-10-26 03:50:53'),
(1, 48, '2026-10-26 03:50:53'),
(2, 6, '2026-10-26 03:50:53'),
(2, 7, '2026-10-26 03:50:53'),
(2, 8, '2026-10-26 03:50:53'),
(2, 10, '2026-10-26 03:50:53'),
(2, 11, '2026-10-26 03:50:53'),
(2, 12, '2026-10-26 03:50:53'),
(2, 13, '2026-10-26 03:50:53'),
(2, 15, '2026-10-26 03:50:53'),
(2, 16, '2026-10-26 03:50:53'),
(2, 17, '2026-10-26 03:50:53'),
(2, 19, '2026-10-26 03:50:53'),
(2, 21, '2026-10-26 03:50:53'),
(2, 23, '2026-10-26 03:50:53'),
(2, 24, '2026-10-26 03:50:53'),
(2, 25, '2026-10-26 03:50:53'),
(2, 26, '2026-10-26 03:50:53'),
(2, 28, '2026-10-26 03:50:53'),
(2, 29, '2026-10-26 03:50:53'),
(2, 30, '2026-10-26 03:50:53'),
(2, 31, '2026-10-26 03:50:53'),
(2, 33, '2026-10-26 03:50:53'),
(2, 34, '2026-10-26 03:50:53'),
(2, 35, '2026-10-26 03:50:53'),
(2, 36, '2026-10-26 03:50:53'),
(2, 37, '2026-10-26 03:50:53'),
(2, 38, '2026-10-26 03:50:53'),
(2, 39, '2026-10-26 03:50:53'),
(2, 40, '2026-10-26 03:50:53'),
(2, 41, '2026-10-26 03:50:53'),
(2, 42, '2026-10-26 03:50:53'),
(2, 43, '2026-10-26 03:50:53'),
(2, 44, '2026-10-26 03:50:53'),
(2, 45, '2026-10-26 03:50:53'),
(2, 46, '2026-10-26 03:50:53'),
(2, 48, '2026-10-26 03:50:53'),
(3, 6, '2026-10-26 03:50:53'),
(3, 7, '2026-10-26 03:50:53'),
(3, 8, '2026-10-26 03:50:53'),
(3, 10, '2026-10-26 03:50:53'),
(3, 11, '2026-10-26 03:50:53'),
(3, 12, '2026-10-26 03:50:53'),
(3, 13, '2026-10-26 03:50:53'),
(3, 15, '2026-10-26 03:50:53'),
(3, 16, '2026-10-26 03:50:53'),
(3, 17, '2026-10-26 03:50:53'),
(3, 19, '2026-10-26 03:50:53'),
(3, 21, '2026-10-26 03:50:53'),
(3, 23, '2026-10-26 03:50:53'),
(3, 24, '2026-10-26 03:50:53'),
(3, 25, '2026-10-26 03:50:53'),
(3, 26, '2026-10-26 03:50:53'),
(3, 28, '2026-10-26 03:50:53'),
(3, 29, '2026-10-26 03:50:53'),
(3, 30, '2026-10-26 03:50:53'),
(3, 31, '2026-10-26 03:50:53'),
(3, 33, '2026-10-26 03:50:53'),
(3, 34, '2026-10-26 03:50:53'),
(3, 35, '2026-10-26 03:50:53'),
(3, 36, '2026-10-26 03:50:53'),
(3, 37, '2026-10-26 03:50:53'),
(3, 38, '2026-10-26 03:50:53'),
(3, 39, '2026-10-26 03:50:53'),
(3, 40, '2026-10-26 03:50:53'),
(3, 41, '2026-10-26 03:50:53'),
(3, 42, '2026-10-26 03:50:53'),
(3, 43, '2026-10-26 03:50:53'),
(3, 44, '2026-10-26 03:50:53'),
(3, 45, '2026-10-26 03:50:53'),
(3, 46, '2026-10-26 03:50:53'),
(3, 48, '2026-10-26 03:50:53'),
(4, 6, '2026-10-26 03:50:53'),
(4, 7, '2026-10-26 03:50:53'),
(4, 8, '2026-10-26 03:50:53'),
(4, 10, '2026-10-26 03:50:53'),
(4, 11, '2026-10-26 03:50:53'),
(4, 12, '2026-10-26 03:50:53'),
(4, 13, '2026-10-26 03:50:53'),
(4, 15, '2026-10-26 03:50:53'),
(4, 16, '2026-10-26 03:50:53'),
(4, 17, '2026-10-26 03:50:53'),
(4, 19, '2026-10-26 03:50:53'),
(4, 21, '2026-10-26 03:50:53'),
(4, 23, '2026-10-26 03:50:53'),
(4, 24, '2026-10-26 03:50:53'),
(4, 25, '2026-10-26 03:50:53'),
(4, 26, '2026-10-26 03:50:53'),
(4, 28, '2026-10-26 03:50:53'),
(4, 29, '2026-10-26 03:50:53'),
(4, 30, '2026-10-26 03:50:53'),
(4, 31, '2026-10-26 03:50:53'),
(4, 33, '2026-10-26 03:50:53'),
(4, 34, '2026-10-26 03:50:53'),
(4, 35, '2026-10-26 03:50:53'),
(4, 36, '2026-10-26 03:50:53'),
(4, 37, '2026-10-26 03:50:53'),
(4, 38, '2026-10-26 03:50:53'),
(4, 39, '2026-10-26 03:50:53'),
(4, 40, '2026-10-26 03:50:53'),
(4, 41, '2026-10-26 03:50:53'),
(4, 42, '2026-10-26 03:50:53'),
(4, 43, '2026-10-26 03:50:53'),
(4, 44, '2026-10-26 03:50:53'),
(4, 45, '2026-10-26 03:50:53'),
(4, 46, '2026-10-26 03:50:53'),
(4, 48, '2026-10-26 03:50:53'),
(5, 6, '2026-10-26 03:50:53'),
(5, 7, '2026-10-26 03:50:53'),
(5, 8, '2026-10-26 03:50:53'),
(5, 10, '2026-10-26 03:50:53'),
(5, 11, '2026-10-26 03:50:53'),
(5, 12, '2026-10-26 03:50:53'),
(5, 13, '2026-10-26 03:50:53'),
(5, 15, '2026-10-26 03:50:53'),
(5, 16, '2026-10-26 03:50:53'),
(5, 17, '2026-10-26 03:50:53'),
(5, 19, '2026-10-26 03:50:53'),
(5, 21, '2026-10-26 03:50:53'),
(5, 23, '2026-10-26 03:50:53'),
(5, 24, '2026-10-26 03:50:53'),
(5, 25, '2026-10-26 03:50:53'),
(5, 26, '2026-10-26 03:50:53'),
(5, 28, '2026-10-26 03:50:53'),
(5, 29, '2026-10-26 03:50:53'),
(5, 30, '2026-10-26 03:50:53'),
(5, 31, '2026-10-26 03:50:53'),
(5, 33, '2026-10-26 03:50:53'),
(5, 34, '2026-10-26 03:50:53'),
(5, 35, '2026-10-26 03:50:53'),
(5, 36, '2026-10-26 03:50:53'),
(5, 37, '2026-10-26 03:50:53'),
(5, 38, '2026-10-26 03:50:53'),
(5, 39, '2026-10-26 03:50:53'),
(5, 40, '2026-10-26 03:50:53'),
(5, 41, '2026-10-26 03:50:53'),
(5, 42, '2026-10-26 03:50:53'),
(5, 43, '2026-10-26 03:50:53'),
(5, 44, '2026-10-26 03:50:53'),
(5, 45, '2026-10-26 03:50:53'),
(5, 46, '2026-10-26 03:50:53'),
(5, 48, '2026-10-26 03:50:53'),
(5, 49, '2026-10-26 03:54:35'),
(5, 50, '2026-10-26 04:05:37'),
(5, 51, '2026-10-26 05:58:16'),
(5, 52, '2026-10-26 18:52:32'),
(5, 53, '2026-10-27 16:41:31'),
(5, 54, '2026-10-27 21:55:27'),
(5, 55, '2026-10-27 20:11:41'),
(7, 6, '2026-10-26 03:50:53'),
(7, 7, '2026-10-26 03:50:53'),
(7, 8, '2026-10-26 03:50:53'),
(7, 10, '2026-10-26 03:50:53'),
(7, 11, '2026-10-26 03:50:53'),
(7, 12, '2026-10-26 03:50:53'),
(7, 13, '2026-10-26 03:50:53'),
(7, 15, '2026-10-26 03:50:53'),
(7, 16, '2026-10-26 03:50:53'),
(7, 17, '2026-10-26 03:50:53'),
(7, 19, '2026-10-26 03:50:53'),
(7, 21, '2026-10-26 03:50:53'),
(7, 23, '2026-10-26 03:50:53'),
(7, 24, '2026-10-26 03:50:53'),
(7, 25, '2026-10-26 03:50:53'),
(7, 26, '2026-10-26 03:50:53'),
(7, 28, '2026-10-26 03:50:53'),
(7, 29, '2026-10-26 03:50:53'),
(7, 30, '2026-10-26 03:50:53'),
(7, 31, '2026-10-26 03:50:53'),
(7, 33, '2026-10-26 03:50:53'),
(7, 34, '2026-10-26 03:50:53'),
(7, 35, '2026-10-26 03:50:53'),
(7, 36, '2026-10-26 03:50:53'),
(7, 37, '2026-10-26 03:50:53'),
(7, 38, '2026-10-26 03:50:53'),
(7, 39, '2026-10-26 03:50:53'),
(7, 40, '2026-10-26 03:50:53'),
(7, 41, '2026-10-26 03:50:53'),
(7, 42, '2026-10-26 03:50:53'),
(7, 43, '2026-10-26 03:50:53'),
(7, 44, '2026-10-26 03:50:53'),
(7, 45, '2026-10-26 03:50:53'),
(7, 46, '2026-10-26 03:50:53'),
(7, 48, '2026-10-26 03:50:53'),
(8, 6, '2026-10-26 03:50:53'),
(8, 7, '2026-10-26 03:50:53'),
(8, 8, '2026-10-26 03:50:53'),
(8, 10, '2026-10-26 03:50:53'),
(8, 11, '2026-10-26 03:50:53'),
(8, 12, '2026-10-26 03:50:53'),
(8, 13, '2026-10-26 03:50:53'),
(8, 15, '2026-10-26 03:50:53'),
(8, 16, '2026-10-26 03:50:53'),
(8, 17, '2026-10-26 03:50:53'),
(8, 19, '2026-10-26 03:50:53'),
(8, 21, '2026-10-26 03:50:53'),
(8, 23, '2026-10-26 03:50:53'),
(8, 24, '2026-10-26 03:50:53'),
(8, 25, '2026-10-26 03:50:53'),
(8, 26, '2026-10-26 03:50:53'),
(8, 28, '2026-10-26 03:50:53'),
(8, 29, '2026-10-26 03:50:53'),
(8, 30, '2026-10-26 03:50:53'),
(8, 31, '2026-10-26 03:50:53'),
(8, 33, '2026-10-26 03:50:53'),
(8, 34, '2026-10-26 03:50:53'),
(8, 35, '2026-10-26 03:50:53'),
(8, 36, '2026-10-26 03:50:53'),
(8, 37, '2026-10-26 03:50:53'),
(8, 38, '2026-10-26 03:50:53'),
(8, 39, '2026-10-26 03:50:53'),
(8, 40, '2026-10-26 03:50:53'),
(8, 41, '2026-10-26 03:50:53'),
(8, 42, '2026-10-26 03:50:53'),
(8, 43, '2026-10-26 03:50:53'),
(8, 44, '2026-10-26 03:50:53'),
(8, 45, '2026-10-26 03:50:53'),
(8, 46, '2026-10-26 03:50:53'),
(8, 48, '2026-10-26 03:50:53'),
(9, 6, '2026-10-26 03:50:53'),
(9, 7, '2026-10-26 03:50:53'),
(9, 8, '2026-10-26 03:50:53'),
(9, 10, '2026-10-26 03:50:53'),
(9, 11, '2026-10-26 03:50:53'),
(9, 12, '2026-10-26 03:50:53'),
(9, 13, '2026-10-26 03:50:53'),
(9, 15, '2026-10-26 03:50:53'),
(9, 16, '2026-10-26 03:50:53'),
(9, 17, '2026-10-26 03:50:53'),
(9, 19, '2026-10-26 03:50:53'),
(9, 21, '2026-10-26 03:50:53'),
(9, 23, '2026-10-26 03:50:53'),
(9, 24, '2026-10-26 03:50:53'),
(9, 25, '2026-10-26 03:50:53'),
(9, 26, '2026-10-26 03:50:53'),
(9, 28, '2026-10-26 03:50:53'),
(9, 29, '2026-10-26 03:50:53'),
(9, 30, '2026-10-26 03:50:53'),
(9, 31, '2026-10-26 03:50:53'),
(9, 33, '2026-10-26 03:50:53'),
(9, 34, '2026-10-26 03:50:53'),
(9, 35, '2026-10-26 03:50:53'),
(9, 36, '2026-10-26 03:50:53'),
(9, 37, '2026-10-26 03:50:53'),
(9, 38, '2026-10-26 03:50:53'),
(9, 39, '2026-10-26 03:50:53'),
(9, 40, '2026-10-26 03:50:53'),
(9, 41, '2026-10-26 03:50:53'),
(9, 42, '2026-10-26 03:50:53'),
(9, 43, '2026-10-26 03:50:53'),
(9, 44, '2026-10-26 03:50:53'),
(9, 45, '2026-10-26 03:50:53'),
(9, 46, '2026-10-26 03:50:53'),
(9, 48, '2026-10-26 03:50:53'),
(10, 6, '2026-10-26 03:50:53'),
(10, 7, '2026-10-26 03:50:53'),
(10, 8, '2026-10-26 03:50:53'),
(10, 10, '2026-10-26 03:50:53'),
(10, 11, '2026-10-26 03:50:53'),
(10, 12, '2026-10-26 03:50:53'),
(10, 13, '2026-10-26 03:50:53'),
(10, 15, '2026-10-26 03:50:53'),
(10, 16, '2026-10-26 03:50:53'),
(10, 17, '2026-10-26 03:50:53'),
(10, 19, '2026-10-26 03:50:53'),
(10, 21, '2026-10-26 03:50:53'),
(10, 23, '2026-10-26 03:50:53'),
(10, 24, '2026-10-26 03:50:53'),
(10, 25, '2026-10-26 03:50:53'),
(10, 26, '2026-10-26 03:50:53'),
(10, 28, '2026-10-26 03:50:53'),
(10, 29, '2026-10-26 03:50:53'),
(10, 30, '2026-10-26 03:50:53'),
(10, 31, '2026-10-26 03:50:53'),
(10, 33, '2026-10-26 03:50:53'),
(10, 34, '2026-10-26 03:50:53'),
(10, 35, '2026-10-26 03:50:53'),
(10, 36, '2026-10-26 03:50:53'),
(10, 37, '2026-10-26 03:50:53'),
(10, 38, '2026-10-26 03:50:53'),
(10, 39, '2026-10-26 03:50:53'),
(10, 40, '2026-10-26 03:50:53'),
(10, 41, '2026-10-26 03:50:53'),
(10, 42, '2026-10-26 03:50:53'),
(10, 43, '2026-10-26 03:50:53'),
(10, 44, '2026-10-26 03:50:53'),
(10, 45, '2026-10-26 03:50:53'),
(10, 46, '2026-10-26 03:50:53'),
(10, 48, '2026-10-26 03:50:53'),
(11, 6, '2026-10-26 03:50:53'),
(11, 7, '2026-10-26 03:50:53'),
(11, 8, '2026-10-26 03:50:53'),
(11, 10, '2026-10-26 03:50:53'),
(11, 11, '2026-10-26 03:50:53'),
(11, 12, '2026-10-26 03:50:53'),
(11, 13, '2026-10-26 03:50:53'),
(11, 15, '2026-10-26 03:50:53'),
(11, 16, '2026-10-26 03:50:53'),
(11, 17, '2026-10-26 03:50:53'),
(11, 19, '2026-10-26 03:50:53'),
(11, 21, '2026-10-26 03:50:53'),
(11, 23, '2026-10-26 03:50:53'),
(11, 24, '2026-10-26 03:50:53'),
(11, 25, '2026-10-26 03:50:53'),
(11, 26, '2026-10-26 03:50:53'),
(11, 28, '2026-10-26 03:50:53'),
(11, 29, '2026-10-26 03:50:53'),
(11, 30, '2026-10-26 03:50:53'),
(11, 31, '2026-10-26 03:50:53'),
(11, 33, '2026-10-26 03:50:53'),
(11, 34, '2026-10-26 03:50:53'),
(11, 35, '2026-10-26 03:50:53'),
(11, 36, '2026-10-26 03:50:53'),
(11, 37, '2026-10-26 03:50:53'),
(11, 38, '2026-10-26 03:50:53'),
(11, 39, '2026-10-26 03:50:53'),
(11, 40, '2026-10-26 03:50:53'),
(11, 41, '2026-10-26 03:50:53'),
(11, 42, '2026-10-26 03:50:53'),
(11, 43, '2026-10-26 03:50:53'),
(11, 44, '2026-10-26 03:50:53'),
(11, 45, '2026-10-26 03:50:53'),
(11, 46, '2026-10-26 03:50:53'),
(11, 48, '2026-10-26 03:50:53'),
(12, 6, '2026-10-26 03:50:53'),
(12, 7, '2026-10-26 03:50:53'),
(12, 8, '2026-10-26 03:50:53'),
(12, 10, '2026-10-26 03:50:53'),
(12, 11, '2026-10-26 03:50:53'),
(12, 12, '2026-10-26 03:50:53'),
(12, 13, '2026-10-26 03:50:53'),
(12, 15, '2026-10-26 03:50:53'),
(12, 16, '2026-10-26 03:50:53'),
(12, 17, '2026-10-26 03:50:53'),
(12, 19, '2026-10-26 03:50:53'),
(12, 21, '2026-10-26 03:50:53'),
(12, 23, '2026-10-26 03:50:53'),
(12, 24, '2026-10-26 03:50:53'),
(12, 25, '2026-10-26 03:50:53'),
(12, 26, '2026-10-26 03:50:53'),
(12, 28, '2026-10-26 03:50:53'),
(12, 29, '2026-10-26 03:50:53'),
(12, 30, '2026-10-26 03:50:53'),
(12, 31, '2026-10-26 03:50:53'),
(12, 33, '2026-10-26 03:50:53'),
(12, 34, '2026-10-26 03:50:53'),
(12, 35, '2026-10-26 03:50:53'),
(12, 36, '2026-10-26 03:50:53'),
(12, 37, '2026-10-26 03:50:53'),
(12, 38, '2026-10-26 03:50:53'),
(12, 39, '2026-10-26 03:50:53'),
(12, 40, '2026-10-26 03:50:53'),
(12, 41, '2026-10-26 03:50:53'),
(12, 42, '2026-10-26 03:50:53'),
(12, 43, '2026-10-26 03:50:53'),
(12, 44, '2026-10-26 03:50:53'),
(12, 45, '2026-10-26 03:50:53'),
(12, 46, '2026-10-26 03:50:53'),
(12, 48, '2026-10-26 03:50:53'),
(12, 50, '2026-10-26 03:55:00'),
(12, 53, '2026-10-27 04:10:16'),
(13, 6, '2026-10-26 03:50:53'),
(13, 7, '2026-10-26 03:50:53'),
(13, 8, '2026-10-26 03:50:53'),
(13, 10, '2026-10-26 03:50:53'),
(13, 11, '2026-10-26 03:50:53'),
(13, 12, '2026-10-26 03:50:53'),
(13, 13, '2026-10-26 03:50:53'),
(13, 15, '2026-10-26 03:50:53'),
(13, 16, '2026-10-26 03:50:53'),
(13, 17, '2026-10-26 03:50:53'),
(13, 19, '2026-10-26 03:50:53'),
(13, 21, '2026-10-26 03:50:53'),
(13, 23, '2026-10-26 03:50:53'),
(13, 24, '2026-10-26 03:50:53'),
(13, 25, '2026-10-26 03:50:53'),
(13, 26, '2026-10-26 03:50:53'),
(13, 28, '2026-10-26 03:50:53'),
(13, 29, '2026-10-26 03:50:53'),
(13, 30, '2026-10-26 03:50:53'),
(13, 31, '2026-10-26 03:50:53'),
(13, 33, '2026-10-26 03:50:53'),
(13, 34, '2026-10-26 03:50:53'),
(13, 35, '2026-10-26 03:50:53'),
(13, 36, '2026-10-26 03:50:53'),
(13, 37, '2026-10-26 03:50:53'),
(13, 38, '2026-10-26 03:50:53'),
(13, 39, '2026-10-26 03:50:53'),
(13, 40, '2026-10-26 03:50:53'),
(13, 41, '2026-10-26 03:50:53'),
(13, 42, '2026-10-26 03:50:53'),
(13, 43, '2026-10-26 03:50:53'),
(13, 44, '2026-10-26 03:50:53'),
(13, 45, '2026-10-26 03:50:53'),
(13, 46, '2026-10-26 03:50:53'),
(13, 48, '2026-10-26 03:50:53'),
(14, 6, '2026-10-26 03:50:53'),
(14, 7, '2026-10-26 03:50:53'),
(14, 8, '2026-10-26 03:50:53'),
(14, 10, '2026-10-26 03:50:53'),
(14, 11, '2026-10-26 03:50:53'),
(14, 12, '2026-10-26 03:50:53'),
(14, 13, '2026-10-26 03:50:53'),
(14, 15, '2026-10-26 03:50:53'),
(14, 16, '2026-10-26 03:50:53'),
(14, 17, '2026-10-26 03:50:53'),
(14, 19, '2026-10-26 03:50:53'),
(14, 21, '2026-10-26 03:50:53'),
(14, 23, '2026-10-26 03:50:53'),
(14, 24, '2026-10-26 03:50:53'),
(14, 25, '2026-10-26 03:50:53'),
(14, 26, '2026-10-26 03:50:53'),
(14, 28, '2026-10-26 03:50:53'),
(14, 29, '2026-10-26 03:50:53'),
(14, 30, '2026-10-26 03:50:53'),
(14, 31, '2026-10-26 03:50:53'),
(14, 33, '2026-10-26 03:50:53'),
(14, 34, '2026-10-26 03:50:53'),
(14, 35, '2026-10-26 03:50:53'),
(14, 36, '2026-10-26 03:50:53'),
(14, 37, '2026-10-26 03:50:53'),
(14, 38, '2026-10-26 03:50:53'),
(14, 39, '2026-10-26 03:50:53'),
(14, 40, '2026-10-26 03:50:53'),
(14, 41, '2026-10-26 03:50:53'),
(14, 42, '2026-10-26 03:50:53'),
(14, 43, '2026-10-26 03:50:53'),
(14, 44, '2026-10-26 03:50:53'),
(14, 45, '2026-10-26 03:50:53'),
(14, 46, '2026-10-26 03:50:53'),
(14, 48, '2026-10-26 03:50:53'),
(16, 6, '2026-10-26 03:50:53'),
(16, 7, '2026-10-26 03:50:53'),
(16, 8, '2026-10-26 03:50:53'),
(16, 10, '2026-10-26 03:50:53'),
(16, 11, '2026-10-26 03:50:53'),
(16, 12, '2026-10-26 03:50:53'),
(16, 13, '2026-10-26 03:50:53'),
(16, 15, '2026-10-26 03:50:53'),
(16, 16, '2026-10-26 03:50:53'),
(16, 17, '2026-10-26 03:50:53'),
(16, 19, '2026-10-26 03:50:53'),
(16, 21, '2026-10-26 03:50:53'),
(16, 23, '2026-10-26 03:50:53'),
(16, 24, '2026-10-26 03:50:53'),
(16, 25, '2026-10-26 03:50:53'),
(16, 26, '2026-10-26 03:50:53'),
(16, 28, '2026-10-26 03:50:53'),
(16, 29, '2026-10-26 03:50:53'),
(16, 30, '2026-10-26 03:50:53'),
(16, 31, '2026-10-26 03:50:53'),
(16, 33, '2026-10-26 03:50:53'),
(16, 34, '2026-10-26 03:50:53'),
(16, 35, '2026-10-26 03:50:53'),
(16, 36, '2026-10-26 03:50:53'),
(16, 37, '2026-10-26 03:50:53'),
(16, 38, '2026-10-26 03:50:53'),
(16, 39, '2026-10-26 03:50:53'),
(16, 40, '2026-10-26 03:50:53'),
(16, 41, '2026-10-26 03:50:53'),
(16, 42, '2026-10-26 03:50:53'),
(16, 43, '2026-10-26 03:50:53'),
(16, 44, '2026-10-26 03:50:53'),
(16, 45, '2026-10-26 03:50:53'),
(16, 46, '2026-10-26 03:50:53'),
(16, 48, '2026-10-26 03:50:53'),
(20, 6, '2026-10-26 03:50:53'),
(20, 7, '2026-10-26 03:50:53'),
(20, 8, '2026-10-26 03:50:53'),
(20, 10, '2026-10-26 03:50:53'),
(20, 11, '2026-10-26 03:50:53'),
(20, 12, '2026-10-26 03:50:53'),
(20, 13, '2026-10-26 03:50:53'),
(20, 15, '2026-10-26 03:50:53'),
(20, 16, '2026-10-26 03:50:53'),
(20, 17, '2026-10-26 03:50:53'),
(20, 19, '2026-10-26 03:50:53'),
(20, 21, '2026-10-26 03:50:53'),
(20, 23, '2026-10-26 03:50:53'),
(20, 24, '2026-10-26 03:50:53'),
(20, 25, '2026-10-26 03:50:53'),
(20, 26, '2026-10-26 03:50:53'),
(20, 28, '2026-10-26 03:50:53'),
(20, 29, '2026-10-26 03:50:53'),
(20, 30, '2026-10-26 03:50:53'),
(20, 31, '2026-10-26 03:50:53'),
(20, 33, '2026-10-26 03:50:53'),
(20, 34, '2026-10-26 03:50:53'),
(20, 35, '2026-10-26 03:50:53'),
(20, 36, '2026-10-26 03:50:53'),
(20, 37, '2026-10-26 03:50:53'),
(20, 38, '2026-10-26 03:50:53'),
(20, 39, '2026-10-26 03:50:53'),
(20, 40, '2026-10-26 03:50:53'),
(20, 41, '2026-10-26 03:50:53'),
(20, 42, '2026-10-26 03:50:53'),
(20, 43, '2026-10-26 03:50:53'),
(20, 44, '2026-10-26 03:50:53'),
(20, 45, '2026-10-26 03:50:53'),
(20, 46, '2026-10-26 03:50:53'),
(20, 48, '2026-10-26 03:50:53'),
(21, 6, '2026-10-26 03:50:53'),
(21, 7, '2026-10-26 03:50:53'),
(21, 8, '2026-10-26 03:50:53'),
(21, 10, '2026-10-26 03:50:53'),
(21, 11, '2026-10-26 03:50:53'),
(21, 12, '2026-10-26 03:50:53'),
(21, 13, '2026-10-26 03:50:53'),
(21, 15, '2026-10-26 03:50:53'),
(21, 16, '2026-10-26 03:50:53'),
(21, 17, '2026-10-26 03:50:53'),
(21, 19, '2026-10-26 03:50:53'),
(21, 21, '2026-10-26 03:50:53'),
(21, 23, '2026-10-26 03:50:53'),
(21, 24, '2026-10-26 03:50:53'),
(21, 25, '2026-10-26 03:50:53'),
(21, 26, '2026-10-26 03:50:53'),
(21, 28, '2026-10-26 03:50:53'),
(21, 29, '2026-10-26 03:50:53'),
(21, 30, '2026-10-26 03:50:53'),
(21, 31, '2026-10-26 03:50:53'),
(21, 33, '2026-10-26 03:50:53'),
(21, 34, '2026-10-26 03:50:53'),
(21, 35, '2026-10-26 03:50:53'),
(21, 36, '2026-10-26 03:50:53'),
(21, 37, '2026-10-26 03:50:53'),
(21, 38, '2026-10-26 03:50:53'),
(21, 39, '2026-10-26 03:50:53'),
(21, 40, '2026-10-26 03:50:53'),
(21, 41, '2026-10-26 03:50:53'),
(21, 42, '2026-10-26 03:50:53'),
(21, 43, '2026-10-26 03:50:53'),
(21, 44, '2026-10-26 03:50:53'),
(21, 45, '2026-10-26 03:50:53'),
(21, 46, '2026-10-26 03:50:53'),
(21, 48, '2026-10-26 03:50:53'),
(21, 49, '2026-10-26 03:56:24'),
(21, 50, '2026-10-26 03:56:32'),
(23, 6, '2026-10-26 03:50:53'),
(23, 7, '2026-10-26 03:50:53'),
(23, 8, '2026-10-26 03:50:53'),
(23, 10, '2026-10-26 03:50:53'),
(23, 11, '2026-10-26 03:50:53'),
(23, 12, '2026-10-26 03:50:53'),
(23, 13, '2026-10-26 03:50:53'),
(23, 15, '2026-10-26 03:50:53'),
(23, 16, '2026-10-26 03:50:53'),
(23, 17, '2026-10-26 03:50:53'),
(23, 19, '2026-10-26 03:50:53'),
(23, 21, '2026-10-26 03:50:53'),
(23, 23, '2026-10-26 03:50:53'),
(23, 24, '2026-10-26 03:50:53'),
(23, 25, '2026-10-26 03:50:53'),
(23, 26, '2026-10-26 03:50:53'),
(23, 28, '2026-10-26 03:50:53'),
(23, 29, '2026-10-26 03:50:53'),
(23, 30, '2026-10-26 03:50:53'),
(23, 31, '2026-10-26 03:50:53'),
(23, 33, '2026-10-26 03:50:53'),
(23, 34, '2026-10-26 03:50:53'),
(23, 35, '2026-10-26 03:50:53'),
(23, 36, '2026-10-26 03:50:53'),
(23, 37, '2026-10-26 03:50:53'),
(23, 38, '2026-10-26 03:50:53'),
(23, 39, '2026-10-26 03:50:53'),
(23, 40, '2026-10-26 03:50:53'),
(23, 41, '2026-10-26 03:50:53'),
(23, 42, '2026-10-26 03:50:53'),
(23, 43, '2026-10-26 03:50:53'),
(23, 44, '2026-10-26 03:50:53'),
(23, 45, '2026-10-26 03:50:53'),
(23, 46, '2026-10-26 03:50:53'),
(23, 48, '2026-10-26 03:50:53'),
(24, 6, '2026-10-26 03:50:53'),
(24, 7, '2026-10-26 03:50:53'),
(24, 8, '2026-10-26 03:50:53'),
(24, 10, '2026-10-26 03:50:53'),
(24, 11, '2026-10-26 03:50:53'),
(24, 12, '2026-10-26 03:50:53'),
(24, 13, '2026-10-26 03:50:53'),
(24, 15, '2026-10-26 03:50:53'),
(24, 16, '2026-10-26 03:50:53'),
(24, 17, '2026-10-26 03:50:53'),
(24, 19, '2026-10-26 03:50:53'),
(24, 21, '2026-10-26 03:50:53'),
(24, 23, '2026-10-26 03:50:53'),
(24, 24, '2026-10-26 03:50:53'),
(24, 25, '2026-10-26 03:50:53'),
(24, 26, '2026-10-26 03:50:53'),
(24, 28, '2026-10-26 03:50:53'),
(24, 29, '2026-10-26 03:50:53'),
(24, 30, '2026-10-26 03:50:53'),
(24, 31, '2026-10-26 03:50:53'),
(24, 33, '2026-10-26 03:50:53'),
(24, 34, '2026-10-26 03:50:53'),
(24, 35, '2026-10-26 03:50:53'),
(24, 36, '2026-10-26 03:50:53'),
(24, 37, '2026-10-26 03:50:53'),
(24, 38, '2026-10-26 03:50:53'),
(24, 39, '2026-10-26 03:50:53'),
(24, 40, '2026-10-26 03:50:53'),
(24, 41, '2026-10-26 03:50:53'),
(24, 42, '2026-10-26 03:50:53'),
(24, 43, '2026-10-26 03:50:53'),
(24, 44, '2026-10-26 03:50:53'),
(24, 45, '2026-10-26 03:50:53'),
(24, 46, '2026-10-26 03:50:53'),
(24, 48, '2026-10-26 03:50:53'),
(24, 52, '2026-10-27 01:00:57'),
(27, 6, '2026-10-26 06:06:40'),
(27, 7, '2026-10-26 06:06:40'),
(27, 8, '2026-10-26 06:06:40'),
(27, 10, '2026-10-26 06:06:40'),
(27, 11, '2026-10-26 06:06:40'),
(27, 12, '2026-10-26 06:06:40'),
(27, 13, '2026-10-26 06:06:40'),
(27, 15, '2026-10-26 06:06:40'),
(27, 16, '2026-10-26 06:06:40'),
(27, 17, '2026-10-26 06:06:40'),
(27, 19, '2026-10-26 06:06:40'),
(27, 21, '2026-10-26 06:06:40'),
(27, 23, '2026-10-26 06:06:40'),
(27, 24, '2026-10-26 06:06:40'),
(27, 25, '2026-10-26 06:06:40'),
(27, 26, '2026-10-26 06:06:40'),
(27, 28, '2026-10-26 06:06:40'),
(27, 29, '2026-10-26 06:06:40'),
(27, 30, '2026-10-26 06:06:40'),
(27, 31, '2026-10-26 06:06:40'),
(27, 33, '2026-10-26 06:06:40'),
(27, 34, '2026-10-26 06:06:40'),
(27, 35, '2026-10-26 06:06:40'),
(27, 36, '2026-10-26 06:06:40'),
(27, 37, '2026-10-26 06:06:40'),
(27, 38, '2026-10-26 06:06:40'),
(27, 39, '2026-10-26 06:06:40'),
(27, 40, '2026-10-26 06:06:40'),
(27, 41, '2026-10-26 06:06:40'),
(27, 42, '2026-10-26 06:06:40'),
(27, 43, '2026-10-26 06:06:40'),
(27, 44, '2026-10-26 06:06:40'),
(27, 45, '2026-10-26 06:06:40'),
(27, 46, '2026-10-26 06:06:40'),
(27, 48, '2026-10-26 06:06:40'),
(27, 49, '2026-10-26 06:06:40'),
(27, 50, '2026-10-26 06:06:40'),
(27, 51, '2026-10-26 06:06:40'),
(28, 6, '2026-10-26 19:08:20'),
(28, 7, '2026-10-26 19:08:20'),
(28, 8, '2026-10-26 19:08:20'),
(28, 10, '2026-10-26 19:08:20'),
(28, 11, '2026-10-26 19:08:20'),
(28, 12, '2026-10-26 19:08:20'),
(28, 13, '2026-10-26 19:08:20'),
(28, 15, '2026-10-26 19:08:20'),
(28, 16, '2026-10-26 19:08:20'),
(28, 17, '2026-10-26 19:08:20'),
(28, 19, '2026-10-26 19:08:20'),
(28, 21, '2026-10-26 19:08:20'),
(28, 23, '2026-10-26 19:08:20'),
(28, 24, '2026-10-26 19:08:20'),
(28, 25, '2026-10-26 19:08:20'),
(28, 26, '2026-10-26 19:08:20'),
(28, 28, '2026-10-26 19:08:20'),
(28, 29, '2026-10-26 19:08:20'),
(28, 30, '2026-10-26 19:08:20'),
(28, 31, '2026-10-26 19:08:20'),
(28, 33, '2026-10-26 19:08:20'),
(28, 34, '2026-10-26 19:08:20'),
(28, 35, '2026-10-26 19:08:20'),
(28, 36, '2026-10-26 19:08:20'),
(28, 37, '2026-10-26 19:08:20'),
(28, 38, '2026-10-26 19:08:20'),
(28, 39, '2026-10-26 19:08:20'),
(28, 40, '2026-10-26 19:08:20'),
(28, 41, '2026-10-26 19:08:20'),
(28, 42, '2026-10-26 19:08:20'),
(28, 43, '2026-10-26 19:08:20'),
(28, 44, '2026-10-26 19:08:20'),
(28, 45, '2026-10-26 19:08:20'),
(28, 46, '2026-10-26 19:08:20'),
(28, 48, '2026-10-26 19:08:20'),
(28, 49, '2026-10-26 19:08:20'),
(28, 50, '2026-10-26 19:08:20'),
(28, 51, '2026-10-26 19:08:20'),
(28, 52, '2026-10-26 19:08:20'),
(29, 6, '2026-10-27 19:48:26'),
(29, 7, '2026-10-27 19:48:26'),
(29, 8, '2026-10-27 19:48:26'),
(29, 10, '2026-10-27 19:48:26'),
(29, 11, '2026-10-27 19:48:26'),
(29, 12, '2026-10-27 19:48:26'),
(29, 13, '2026-10-27 19:48:26'),
(29, 15, '2026-10-27 19:48:26'),
(29, 16, '2026-10-27 19:48:26'),
(29, 17, '2026-10-27 19:48:26'),
(29, 19, '2026-10-27 19:48:26'),
(29, 21, '2026-10-27 19:48:26'),
(29, 23, '2026-10-27 19:48:26'),
(29, 24, '2026-10-27 19:48:26'),
(29, 25, '2026-10-27 19:48:26'),
(29, 26, '2026-10-27 19:48:26'),
(29, 28, '2026-10-27 19:48:26'),
(29, 29, '2026-10-27 19:48:26'),
(29, 30, '2026-10-27 19:48:26'),
(29, 31, '2026-10-27 19:48:26'),
(29, 33, '2026-10-27 19:48:26'),
(29, 34, '2026-10-27 19:48:26'),
(29, 35, '2026-10-27 19:48:26'),
(29, 36, '2026-10-27 19:48:26'),
(29, 37, '2026-10-27 19:48:26'),
(29, 38, '2026-10-27 19:48:26'),
(29, 39, '2026-10-27 19:48:26'),
(29, 40, '2026-10-27 19:48:26'),
(29, 41, '2026-10-27 19:48:26'),
(29, 42, '2026-10-27 19:48:26'),
(29, 43, '2026-10-27 19:48:26'),
(29, 44, '2026-10-27 19:48:26'),
(29, 45, '2026-10-27 19:48:26'),
(29, 46, '2026-10-27 19:48:26'),
(29, 48, '2026-10-27 19:48:26'),
(29, 49, '2026-10-27 19:48:26'),
(29, 50, '2026-10-27 19:48:26'),
(29, 51, '2026-10-27 19:48:26'),
(29, 52, '2026-10-27 19:48:26'),
(29, 53, '2026-10-27 19:48:26'),
(29, 54, '2026-10-27 19:52:23');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_resolutions`
--

CREATE TABLE `ticket_resolutions` (
  `id` int(11) NOT NULL,
  `ticket_id` int(11) NOT NULL,
  `content` mediumtext NOT NULL,
  `resolved_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_resolutions`
--

INSERT INTO `ticket_resolutions` (`id`, `ticket_id`, `content`, `resolved_by`, `created_at`, `updated_at`) VALUES
(1, 16, 'Al final eso funco', 3, '2026-07-17 21:42:02', '2026-07-18 09:49:51'),
(2, 12, 'dsdsdss', 5, '2026-07-18 09:25:21', '2026-07-18 09:25:21'),
(4, 13, 'ok1', 5, '2026-07-18 19:00:52', '2026-07-18 19:02:27'),
(6, 8, 'ok', 5, '2026-07-18 19:08:18', '2026-07-18 19:08:18'),
(7, 21, 'ok', 5, '2026-07-18 19:15:08', '2026-07-18 19:15:08'),
(9, 26, 'se resolvio, cambie el coso', 13, '2026-07-20 02:57:29', '2026-07-20 02:57:29'),
(11, 28, 'resueklto', 13, '2026-10-07 00:26:04', '2026-10-07 00:26:04'),
(17, 37, '<p>Prueba imagen</p><img data-attachment-id=\"12\" />', 5, '2026-10-15 21:44:45', '2026-10-15 21:44:45'),
(19, 48, '<p>resuelto</p>', 5, '2026-10-23 20:51:04', '2026-10-23 20:51:04');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_views`
--

CREATE TABLE `ticket_views` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(120) NOT NULL,
  `scope` varchar(20) NOT NULL,
  `visibility` varchar(20) NOT NULL DEFAULT 'personal',
  `share_group_id` int(11) DEFAULT NULL,
  `filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`filters`)),
  `sort_by` varchar(50) NOT NULL DEFAULT 'date-desc',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `hidden` tinyint(1) NOT NULL DEFAULT 0,
  `audience` varchar(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_views`
--

INSERT INTO `ticket_views` (`id`, `user_id`, `name`, `scope`, `visibility`, `share_group_id`, `filters`, `sort_by`, `created_at`, `updated_at`, `sort_order`, `hidden`, `audience`) VALUES
(2, 5, 'Requerimientos', 'admin', 'personal', NULL, '{\"type\":\"requirement\",\"status\":[\"open\",\"in-progress\",\"on-hold\"]}', 'date-desc', '2026-07-18 10:20:09', '2026-07-18 10:20:09', 0, 0, NULL),
(3, 5, 'Incidentes Criticos', 'tickets', 'personal', NULL, '{\"type\":\"incident\",\"status\":[\"open\",\"in-progress\",\"on-hold\"]}', 'date-desc', '2026-07-18 10:49:45', '2026-07-18 10:49:45', 0, 0, NULL),
(5, 5, 'Mesa de Ayuda - N1', 'tickets', 'group', 1, '{\"filter_group_id\":1,\"status\":[\"on-hold\",\"in-progress\",\"open\"]}', 'date-desc', '2026-10-07 03:16:45', '2026-10-23 18:17:16', 0, 0, NULL),
(6, 5, 'Redes', 'tickets', 'group', 3, '{\"filter_group_id\":3,\"status\":[\"resolved\",\"on-hold\",\"in-progress\",\"open\"]}', 'date-desc', '2026-10-07 03:25:28', '2026-10-07 03:25:28', 0, 0, NULL),
(8, 13, 'MESA RESUELTOS', 'tickets', 'personal', NULL, '{\"type\":\"incident\",\"filter_group_id\":1,\"status\":[\"resolved\"]}', 'date-desc', '2026-10-08 02:52:03', '2026-10-08 02:52:03', 0, 0, NULL),
(9, 5, 'Todos los Resueltos', 'tickets', 'personal', NULL, '{\"filter_group_ids\":[1,6,5,3,7,4,2],\"status\":[\"resolved\"],\"filter_order\":[\"group\",\"status\"]}', 'date-desc', '2026-10-26 05:23:20', '2026-10-26 05:23:20', 0, 0, NULL),
(12, 5, 'DG Beltrán', 'tickets', 'group', 5, '{\"filter_group_id\":5,\"group_id\":5,\"filter_group_ids\":[5],\"status\":[\"on-hold\",\"in-progress\",\"open\"],\"filter_order\":[\"status\",\"group\"]}', 'date-desc', '2026-10-26 06:06:06', '2026-10-26 06:06:06', 0, 0, NULL),
(13, 5, 'Incidentes Criticos', 'tickets', 'personal', NULL, '{\"priority\":\"high\",\"priorities\":[\"high\"],\"filter_group_ids\":[1,6,5,3,7,4,2],\"status\":[\"on-hold\",\"in-progress\",\"open\"],\"filter_order\":[\"status\",\"group\",\"priority\"],\"columns\":[\"id\",\"title\",\"created\",\"due\",\"sla_status\",\"assignee\",\"group\",\"status\"]}', 'date-desc', '2026-10-26 06:16:07', '2026-10-26 18:47:18', 0, 0, NULL),
(17, 13, 'Seguinf resueltos', 'tickets', 'personal', NULL, '{\"filter_group_id\":7,\"group_id\":7,\"filter_group_ids\":[7],\"status\":[\"resolved\"],\"filter_order\":[\"status\",\"group\"],\"columns\":[\"id\",\"title\",\"category\",\"group\",\"status\",\"created\"]}', 'date-desc', '2026-10-26 19:04:49', '2026-10-26 19:04:49', 0, 0, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ticket_view_groups`
--

CREATE TABLE `ticket_view_groups` (
  `view_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ticket_view_groups`
--

INSERT INTO `ticket_view_groups` (`view_id`, `group_id`) VALUES
(5, 1),
(6, 3),
(12, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `role` varchar(20) NOT NULL DEFAULT 'user',
  `ui_theme` varchar(10) NOT NULL DEFAULT 'light',
  `ui_language` varchar(5) NOT NULL DEFAULT 'es'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `created_at`, `role`, `ui_theme`, `ui_language`) VALUES
(1, 'test@ejemplo.com', '$2b$10$JH77Okg10uvtRglIkr3m4ekemectz73AbrzK60heFFXdFs4Advkv2', '2026-06-05 04:08:05', 'user', 'light', 'es'),
(2, 'test2@ejemplo.com', '$2b$10$VgUX5Lirs.1oYkwzZQFkKue3ZtB6DsulLCj8G6EaK0zhomhKrDBZm', '2026-06-05 04:08:14', 'user', 'light', 'es'),
(3, 'luciano@gmail.com', '$2b$10$ZxyaDUmM75lzC04FpIZ5UefMsZeKczTywQvXsMUPhN6iAdmfHDU/i', '2026-06-05 04:11:58', 'technician', 'light', 'es'),
(4, 'x@x.com', '$2b$10$6c7/QKAyQ8Z1vo/XToMx5ujxfCjNYkw8xI1uuRmSMGniqgAJ2wKee', '2026-06-19 01:46:48', 'user', 'light', 'es'),
(5, 'admin@g.com', '$2b$10$Szn7n4Uepg9fBlZqa7OiFORnmt5RmGa8gSu79nmqb23SjncqG1dzm', '2026-06-19 03:00:12', 'admin', 'dark', 'es'),
(7, 'paola@p.com', '$2b$10$PGxD.g.dqjppUiWQZzwnhO8jijcKSzd1VXxzNC5H126GLGzxoeFb2', '2026-06-22 23:08:54', 'user', 'light', 'es'),
(8, 'ltarizzo91@gmail.com', '$2b$10$OB432LZ75jpC8fD1VHj3wuZJXHLoCuAn6O4WXmurCIuRW5kgk1PSe', '2026-06-22 23:36:18', 'technician', 'light', 'es'),
(9, 'lucho@g.com', '$2b$10$unwFMOiyYKWA4NdHW4zfp.i8E4U9jeiR4HKwmxFgt0qzt.Nx9UFmi', '2026-07-17 19:18:40', 'technician', 'light', 'es'),
(10, 'x.x@x.com', '$2b$10$fuaTS0aov8N7qGjFYbhkiOi9HhjOud5xNLq7Pi8BJL45eRX0keyua', '2026-07-18 10:20:57', 'technician', 'light', 'es'),
(11, 'fete@g.com', '$2b$10$sjTKkTdmNKAbuBVwwrhALuX8EPMJ/Q0qr1HemkdVHHA8pZEf46G42', '2026-07-18 10:51:08', 'user', 'light', 'es'),
(12, 'user@g.com', '$2b$10$CvFKaDRBS5GotNm5pFkucOo7/f8MJ8xzPCafWlHXAw7XJKMPTh9La', '2026-07-18 19:24:12', 'user', 'dark', 'es'),
(13, 'tecnico@g.com', '$2b$10$2zyfmllx2Fluk68n.6ZsS.EVtwa1y9J2iHDpJowsXFbm3AnrZlM7O', '2026-07-18 19:42:54', 'technician', 'light', 'es'),
(14, 'paola@gmail.com', '$2b$10$OPb6iu9mWpcY4t9rKMKfRe9Od3lXApzwKd/u57oe8vuB.g62kTUES', '2026-07-20 02:33:13', 'technician', 'light', 'es'),
(16, 'elpikudeloro@gmail.com', '$2b$10$gVhNeFGFHufEGVZjyhVuH.i9Eil03TBA4WC/XPEymggMtg80UdqlS', '2026-09-25 22:01:13', 'user', 'light', 'es'),
(20, 'redes@g.com', '$2b$10$Ji4NlhOUpmcriLWR9ke7XuFSDg/3eCFEBve9t9q5rFPbz6SFTJ4x6', '2026-10-07 03:23:01', 'technician', 'light', 'es'),
(21, 'tecnico-mesa@g.com', '$2b$10$eKXAoXRoLYq/bvko5HqDI.RCYT7rfEUqeNxu.7FygUlOzOfh0oR5q', '2026-10-07 03:30:30', 'technician', 'dark', 'es'),
(23, 'tecnico-redes@g.com', '$2b$10$4es.fvzAJkpzKKUVBOEiLuXX7DQZTi2aK7UBVV7LUurccV6WYvl2e', '2026-10-09 02:45:47', 'technician', 'light', 'es'),
(24, 'vista@g.com', '$2b$10$EEzGjuD5sqcoOQPmnavsWOgaB4aIWleV3ePVZ4ovVYDpxHjVSk5S2', '2026-10-09 03:23:41', 'user', 'dark', 'es'),
(27, 'pao@g.com', '$2b$10$37ynm.3wa38i5on1BDWyTODCclyk6n5bcXuEKDBOK4.bMcD7aNC2C', '2026-10-26 06:06:40', 'technician', 'light', 'es'),
(28, 'paolacastillofotografia@gmail.com', '$2b$10$Ni0KoDHshnOlutbS2z8Dn.8sZxyOlXPRzDmgTdbBNHBzcnI3vqQoa', '2026-10-26 19:08:20', 'user', 'light', 'es'),
(29, 'judaspriest@g.com', '$2b$10$nBq8u8iq/2oIKUyOzQn6BODreYLNK6Dm1I7t5mXMFR4yzN1RtMPRa', '2026-10-27 19:48:26', 'user', 'dark', 'es');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_groups`
--

CREATE TABLE `user_groups` (
  `user_id` int(11) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_groups`
--

INSERT INTO `user_groups` (`user_id`, `group_id`) VALUES
(3, 2),
(3, 6),
(3, 7),
(8, 3),
(8, 6),
(8, 7),
(9, 1),
(9, 2),
(9, 5),
(9, 6),
(9, 7),
(10, 2),
(10, 4),
(10, 6),
(10, 7),
(13, 1),
(13, 6),
(13, 7),
(14, 5),
(20, 3),
(21, 1),
(21, 2),
(21, 3),
(21, 4),
(21, 5),
(23, 3),
(27, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_roles`
--

CREATE TABLE `user_roles` (
  `user_id` int(11) NOT NULL,
  `role_id` int(11) NOT NULL,
  `assigned_by` int(11) DEFAULT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `valid_from` timestamp NULL DEFAULT NULL,
  `valid_until` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_roles`
--

INSERT INTO `user_roles` (`user_id`, `role_id`, `assigned_by`, `assigned_at`, `valid_from`, `valid_until`) VALUES
(1, 4, NULL, '2026-10-08 04:48:15', NULL, NULL),
(2, 4, NULL, '2026-10-08 04:48:15', NULL, NULL),
(3, 3, NULL, '2026-10-08 04:48:15', NULL, NULL),
(4, 1, 5, '2026-10-09 04:16:30', NULL, NULL),
(5, 1, 5, '2026-10-27 01:09:34', NULL, NULL),
(5, 2, 5, '2026-10-27 01:09:34', NULL, NULL),
(5, 3, 5, '2026-10-27 01:09:34', NULL, NULL),
(7, 4, NULL, '2026-10-08 04:48:15', NULL, NULL),
(8, 3, NULL, '2026-10-08 04:48:15', NULL, NULL),
(9, 3, NULL, '2026-10-08 04:48:15', NULL, NULL),
(10, 3, NULL, '2026-10-08 04:48:15', NULL, NULL),
(11, 4, NULL, '2026-10-08 04:48:15', NULL, NULL),
(12, 4, NULL, '2026-10-27 04:44:11', NULL, NULL),
(13, 2, 5, '2026-10-26 20:09:46', NULL, NULL),
(13, 3, 5, '2026-10-26 20:09:46', NULL, NULL),
(14, 3, NULL, '2026-10-08 04:48:15', NULL, NULL),
(16, 15, 5, '2026-10-22 04:12:14', NULL, NULL),
(20, 3, NULL, '2026-10-08 04:48:15', NULL, NULL),
(21, 1, 5, '2026-10-27 04:05:44', NULL, NULL),
(21, 3, 5, '2026-10-27 04:05:44', NULL, NULL),
(21, 15, 5, '2026-10-27 04:05:44', NULL, NULL),
(23, 3, NULL, '2026-10-09 03:10:41', NULL, NULL),
(24, 199, 5, '2026-10-26 20:40:21', NULL, NULL),
(27, 3, NULL, '2026-10-26 06:07:01', NULL, NULL),
(28, 4, NULL, '2026-10-26 19:08:20', NULL, NULL),
(29, 4, NULL, '2026-10-27 19:48:26', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `user_view_layout`
--

CREATE TABLE `user_view_layout` (
  `user_id` int(11) NOT NULL,
  `item_key` varchar(80) NOT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `user_view_layout`
--

INSERT INTO `user_view_layout` (`user_id`, `item_key`, `sort_order`) VALUES
(5, 'system:all_my_groups', 4),
(5, 'system:all_my_requests', 7),
(5, 'system:all_requests', 6),
(5, 'system:pending_my_requests', 5),
(5, 'view:12', 8),
(5, 'view:13', 9),
(5, 'view:2', 1),
(5, 'view:3', 3),
(5, 'view:5', 0),
(5, 'view:6', 2),
(5, 'view:9', 10),
(11, 'system:all_my_requests', 1),
(11, 'system:pending_my_requests', 0),
(12, 'system:all_my_requests', 1),
(12, 'system:pending_my_requests', 0),
(12, 'system:resolved_my_requests', 2),
(13, 'system:all_my_groups', 3),
(13, 'system:all_my_requests', 2),
(13, 'system:pending_my_requests', 1),
(13, 'view:5', 0),
(13, 'view:8', 4),
(16, 'system:all_my_requests', 0),
(16, 'system:pending_my_requests', 2),
(16, 'system:resolved_my_requests', 1),
(20, 'system:all_my_groups', 1),
(20, 'system:all_my_requests', 2),
(20, 'system:pending_my_requests', 3),
(20, 'view:6', 0),
(21, 'system:all_my_groups', 1),
(21, 'system:all_my_requests', 2),
(21, 'system:pending_my_requests', 3),
(21, 'view:5', 0),
(23, 'system:all_my_groups', 1),
(23, 'system:all_my_requests', 2),
(23, 'system:pending_my_requests', 3),
(23, 'view:6', 0),
(27, 'system:all_my_groups', 1),
(27, 'system:all_my_requests', 2),
(27, 'system:pending_my_requests', 3),
(27, 'view:12', 0);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `groups`
--
ALTER TABLE `groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indices de la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `actor_user_id` (`actor_user_id`),
  ADD KEY `idx_notifications_user_read` (`user_id`,`read_at`),
  ADD KEY `idx_notifications_user_created` (`user_id`,`created_at`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reset_token_hash` (`token_hash`),
  ADD KEY `idx_reset_user` (`user_id`);

--
-- Indices de la tabla `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `uq_roles_name` (`name`),
  ADD KEY `fk_roles_parent` (`parent_role_id`),
  ADD KEY `fk_roles_created_by` (`created_by`);

--
-- Indices de la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`role_id`,`permission_id`),
  ADD KEY `fk_rp_permission` (`permission_id`);

--
-- Indices de la tabla `role_permission_scopes`
--
ALTER TABLE `role_permission_scopes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_role_scope` (`role_id`,`permission_id`,`scope_type`,`scope_mode`,`scope_ref_id`),
  ADD KEY `fk_rps_permission` (`permission_id`);

--
-- Indices de la tabla `sla_policies`
--
ALTER TABLE `sla_policies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `priority` (`priority`);

--
-- Indices de la tabla `solutions`
--
ALTER TABLE `solutions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`),
  ADD KEY `updated_by` (`updated_by`),
  ADD KEY `approved_by` (`approved_by`);

--
-- Indices de la tabla `solution_attachments`
--
ALTER TABLE `solution_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `solution_id` (`solution_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `solution_groups`
--
ALTER TABLE `solution_groups`
  ADD PRIMARY KEY (`solution_id`,`group_id`),
  ADD KEY `group_id` (`group_id`);

--
-- Indices de la tabla `solution_uses`
--
ALTER TABLE `solution_uses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `solution_id` (`solution_id`),
  ADD KEY `ticket_id` (`ticket_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `tickets`
--
ALTER TABLE `tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indices de la tabla `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_id` (`ticket_id`),
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
-- Indices de la tabla `ticket_reads`
--
ALTER TABLE `ticket_reads`
  ADD PRIMARY KEY (`user_id`,`ticket_id`),
  ADD KEY `idx_ticket_reads_ticket` (`ticket_id`);

--
-- Indices de la tabla `ticket_resolutions`
--
ALTER TABLE `ticket_resolutions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_id` (`ticket_id`),
  ADD KEY `resolved_by` (`resolved_by`);

--
-- Indices de la tabla `ticket_views`
--
ALTER TABLE `ticket_views`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `share_group_id` (`share_group_id`);

--
-- Indices de la tabla `ticket_view_groups`
--
ALTER TABLE `ticket_view_groups`
  ADD PRIMARY KEY (`view_id`,`group_id`),
  ADD KEY `group_id` (`group_id`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indices de la tabla `user_groups`
--
ALTER TABLE `user_groups`
  ADD PRIMARY KEY (`user_id`,`group_id`),
  ADD KEY `group_id` (`group_id`);

--
-- Indices de la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`user_id`,`role_id`),
  ADD KEY `fk_ur_role` (`role_id`),
  ADD KEY `fk_ur_assigned_by` (`assigned_by`);

--
-- Indices de la tabla `user_view_layout`
--
ALTER TABLE `user_view_layout`
  ADD PRIMARY KEY (`user_id`,`item_key`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `groups`
--
ALTER TABLE `groups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `permissions`
--
ALTER TABLE `permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1567;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=230;

--
-- AUTO_INCREMENT de la tabla `role_permission_scopes`
--
ALTER TABLE `role_permission_scopes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `sla_policies`
--
ALTER TABLE `sla_policies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `solutions`
--
ALTER TABLE `solutions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de la tabla `solution_attachments`
--
ALTER TABLE `solution_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `solution_uses`
--
ALTER TABLE `solution_uses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `tickets`
--
ALTER TABLE `tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de la tabla `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `ticket_comments`
--
ALTER TABLE `ticket_comments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT de la tabla `ticket_history`
--
ALTER TABLE `ticket_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=679;

--
-- AUTO_INCREMENT de la tabla `ticket_resolutions`
--
ALTER TABLE `ticket_resolutions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de la tabla `ticket_views`
--
ALTER TABLE `ticket_views`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`actor_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `fk_roles_created_by` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_roles_parent` FOREIGN KEY (`parent_role_id`) REFERENCES `roles` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `fk_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rp_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `role_permission_scopes`
--
ALTER TABLE `role_permission_scopes`
  ADD CONSTRAINT `fk_rps_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_rps_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solutions`
--
ALTER TABLE `solutions`
  ADD CONSTRAINT `solutions_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `solutions_ibfk_2` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `solutions_ibfk_3` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `solution_attachments`
--
ALTER TABLE `solution_attachments`
  ADD CONSTRAINT `solution_attachments_ibfk_1` FOREIGN KEY (`solution_id`) REFERENCES `solutions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solution_attachments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `solution_groups`
--
ALTER TABLE `solution_groups`
  ADD CONSTRAINT `solution_groups_ibfk_1` FOREIGN KEY (`solution_id`) REFERENCES `solutions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solution_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solution_uses`
--
ALTER TABLE `solution_uses`
  ADD CONSTRAINT `solution_uses_ibfk_1` FOREIGN KEY (`solution_id`) REFERENCES `solutions` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solution_uses_ibfk_2` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solution_uses_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `tickets`
--
ALTER TABLE `tickets`
  ADD CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `ticket_attachments`
--
ALTER TABLE `ticket_attachments`
  ADD CONSTRAINT `ticket_attachments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_attachments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

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

--
-- Filtros para la tabla `ticket_reads`
--
ALTER TABLE `ticket_reads`
  ADD CONSTRAINT `fk_ticket_reads_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ticket_reads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `ticket_resolutions`
--
ALTER TABLE `ticket_resolutions`
  ADD CONSTRAINT `ticket_resolutions_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_resolutions_ibfk_2` FOREIGN KEY (`resolved_by`) REFERENCES `users` (`id`);

--
-- Filtros para la tabla `ticket_views`
--
ALTER TABLE `ticket_views`
  ADD CONSTRAINT `ticket_views_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_views_ibfk_2` FOREIGN KEY (`share_group_id`) REFERENCES `groups` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `ticket_view_groups`
--
ALTER TABLE `ticket_view_groups`
  ADD CONSTRAINT `ticket_view_groups_ibfk_1` FOREIGN KEY (`view_id`) REFERENCES `ticket_views` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ticket_view_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_groups`
--
ALTER TABLE `user_groups`
  ADD CONSTRAINT `user_groups_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `user_groups_ibfk_2` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `fk_ur_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `user_view_layout`
--
ALTER TABLE `user_view_layout`
  ADD CONSTRAINT `user_view_layout_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
