ALTER TABLE `config_oficina` ADD `logomarca_url` varchar(500);--> statement-breakpoint
ALTER TABLE `local_users` ADD `role` enum('user','admin') DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `user_id` int;--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `veiculo_placa` varchar(20);--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `veiculo_modelo` varchar(100);--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `veiculo_ano` varchar(10);--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `houve_deslocamento` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `km_gasto` decimal(10,2);--> statement-breakpoint
ALTER TABLE `ordens_servico` ADD `valor_por_km` decimal(10,2);