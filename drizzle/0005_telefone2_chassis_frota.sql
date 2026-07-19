-- Adiciona segundo telefone na config da oficina
ALTER TABLE `config_oficina` ADD COLUMN `telefone2` varchar(20);

-- Adiciona chassis e frota nas ordens de serviço
ALTER TABLE `ordens_servico` ADD COLUMN `veiculo_chassis` varchar(50);
ALTER TABLE `ordens_servico` ADD COLUMN `veiculo_frota` varchar(30);
