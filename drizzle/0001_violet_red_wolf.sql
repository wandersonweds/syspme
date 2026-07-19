CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(150) NOT NULL,
	`telefone` varchar(20) NOT NULL,
	`cpf_cnpj` varchar(20) NOT NULL,
	`endereco` varchar(255) NOT NULL,
	`email` varchar(150) NOT NULL,
	`ativo` boolean NOT NULL DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `config_oficina` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(150) NOT NULL DEFAULT 'Minha Oficina',
	`telefone` varchar(20),
	`endereco` varchar(255),
	`cnpj` varchar(20),
	`email` varchar(150),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `config_oficina_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `itens_os` (
	`id` int AUTO_INCREMENT NOT NULL,
	`os_id` int NOT NULL,
	`tipo` enum('Serviço','Peça') NOT NULL,
	`descricao` varchar(255) NOT NULL,
	`quantidade` decimal(10,2) NOT NULL,
	`valor_unitario` decimal(10,2) NOT NULL,
	`subtotal` decimal(10,2) NOT NULL,
	CONSTRAINT `itens_os_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `local_users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`username` varchar(64) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`nome` varchar(150) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `local_users_id` PRIMARY KEY(`id`),
	CONSTRAINT `local_users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
CREATE TABLE `ordens_servico` (
	`id` int AUTO_INCREMENT NOT NULL,
	`cliente_id` int NOT NULL,
	`status` enum('Aberta','Em Andamento','Finalizada','Cancelada') NOT NULL DEFAULT 'Aberta',
	`desconto` decimal(10,2) NOT NULL DEFAULT '0.00',
	`forma_pagamento` enum('Dinheiro','Cartão de Crédito','Cartão de Débito','Pix','Boleto','Outro') DEFAULT 'Dinheiro',
	`valor_total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`observacoes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ordens_servico_id` PRIMARY KEY(`id`)
);
