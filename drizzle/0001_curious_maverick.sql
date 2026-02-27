CREATE TABLE `clienteFichas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`arquivoPath` varchar(500) NOT NULL,
	`arquivoUrl` varchar(500) NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clienteFichas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `clientes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tipo` enum('PF','PJ') NOT NULL DEFAULT 'PF',
	`nomeRazao` varchar(180) NOT NULL,
	`cpfCnpj` varchar(25) NOT NULL,
	`rgIe` varchar(25),
	`nascimento` date,
	`telefone1` varchar(30),
	`telefone2` varchar(30),
	`whatsapp` varchar(30),
	`email` varchar(180),
	`cep` varchar(12),
	`rua` varchar(180),
	`numero` varchar(20),
	`bairro` varchar(120),
	`cidade` varchar(120),
	`uf` varchar(2),
	`complemento` varchar(120),
	`referencia` varchar(180),
	`observacoes` text,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clientes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `funcionarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(120) NOT NULL,
	`email` varchar(180) NOT NULL,
	`senhaHash` varchar(255) NOT NULL,
	`perfil` enum('ADMIN','FUNCIONARIO') NOT NULL DEFAULT 'FUNCIONARIO',
	`telefone` varchar(30),
	`cargo` varchar(80),
	`ativo` int NOT NULL DEFAULT 1,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `funcionarios_id` PRIMARY KEY(`id`),
	CONSTRAINT `funcionarios_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `instalacaoFotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instalacaoId` int NOT NULL,
	`arquivoPath` varchar(500) NOT NULL,
	`arquivoUrl` varchar(500) NOT NULL,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instalacaoFotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instalacaoMateriais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`instalacaoId` int NOT NULL,
	`produtoId` int NOT NULL,
	`quantidade` decimal(12,2) NOT NULL,
	`observacoes` varchar(255),
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `instalacaoMateriais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `instalacoes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clienteId` int NOT NULL,
	`tipo` enum('ALARME','CAMERA','CERCA') NOT NULL,
	`enderecoExecucao` varchar(255),
	`dataPrevista` date,
	`funcionarioId` int,
	`status` enum('PENDENTE','EM_ANDAMENTO','CONCLUIDA','CANCELADA') NOT NULL DEFAULT 'PENDENTE',
	`observacoes` text,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`finalizadoEm` datetime,
	CONSTRAINT `instalacoes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `logsAuditoria` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funcionarioId` int,
	`acao` varchar(120) NOT NULL,
	`entidade` varchar(80) NOT NULL,
	`entidadeId` int,
	`detalhes` json,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `logsAuditoria_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pontos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`funcionarioId` int NOT NULL,
	`data` date NOT NULL,
	`horaEntrada` datetime,
	`horaInicioAlmoco` datetime,
	`horaFimAlmoco` datetime,
	`horaSaida` datetime,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pontos_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_ponto_func_data` UNIQUE(`funcionarioId`,`data`)
);
--> statement-breakpoint
CREATE TABLE `produtos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(30),
	`nome` varchar(220) NOT NULL,
	`categoria` enum('ALARME','CAMERA','CERCA','OUTROS') NOT NULL,
	`unidade` varchar(20) DEFAULT 'un',
	`estoque` decimal(12,2) DEFAULT '0',
	`ativo` int NOT NULL DEFAULT 1,
	`criadoEm` timestamp NOT NULL DEFAULT (now()),
	`atualizadoEm` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `produtos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `clienteFichas` ADD CONSTRAINT `clienteFichas_clienteId_clientes_id_fk` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instalacaoFotos` ADD CONSTRAINT `instalacaoFotos_instalacaoId_instalacoes_id_fk` FOREIGN KEY (`instalacaoId`) REFERENCES `instalacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instalacaoMateriais` ADD CONSTRAINT `instalacaoMateriais_instalacaoId_instalacoes_id_fk` FOREIGN KEY (`instalacaoId`) REFERENCES `instalacoes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instalacaoMateriais` ADD CONSTRAINT `instalacaoMateriais_produtoId_produtos_id_fk` FOREIGN KEY (`produtoId`) REFERENCES `produtos`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instalacoes` ADD CONSTRAINT `instalacoes_clienteId_clientes_id_fk` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `instalacoes` ADD CONSTRAINT `instalacoes_funcionarioId_funcionarios_id_fk` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `logsAuditoria` ADD CONSTRAINT `logsAuditoria_funcionarioId_funcionarios_id_fk` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `pontos` ADD CONSTRAINT `pontos_funcionarioId_funcionarios_id_fk` FOREIGN KEY (`funcionarioId`) REFERENCES `funcionarios`(`id`) ON DELETE no action ON UPDATE no action;