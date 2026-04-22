# Avaliação 01: Modelagem de Data Warehouse
## PARTE I - Modelagem SBD OLTP

**Prazo:** TERÇA, dia 21 de abril de 2026  
**Atenção:** Não entregou = NOTA ZERO em ambas as partes

---

## Objetivo

Construir um modelo dimensional de um Data Warehouse para um grupo de empresas de locação de veículos.

## Contexto

1. Seis empresas independentes de aluguel de automóveis (locação) resolveram se associar para compartilhar os seus pátios.
2. Uma delas tem o pátio no Aeroporto do Galeão, a outra no Santos Dumont, a terceira tem pátio na Rodoviária e as demais possuem pátios, respectivamente, no Shopping Rio Sul, Nova América e Barra Shopping.
3. Cada pátio se parece com um grande estacionamento. Cada um possui um certo número de vagas, identificadas por um código alfanumérico, e serviços como os de retirada e entrega de veículos.
4. Cada uma das empresas possui os seus próprios sistemas operativos (transacionais) para auxiliar nas operações do negócio, incluindo um sistema de controle do cadastro de clientes, controle da frota de veículo, sistema de reserva e locação (na loja física, ou por APP/site), sistema de controle de pátio e outros sistemas auxiliares para o RH, compras, fornecedores etc.
5. As empresas continuarão a utilizar os seus sistemas operativos já existentes, uma vez que funcionam bem. A alteração que sofrerão é apenas para permitir que os veículos alugados possam ser retirados e entregues em qualquer dos seis pátios.
6. Esta alteração é simples pois será baseada na extensão da identificação das "vagas" no pátio para incluir os outros cinco pátios, sendo que o sistema de Reserva e Locação passará a ter a escolha do pátio de retirada e de entrega do veículo.
7. Todos os sistemas estão baseados em SGBD Relacionais.
8. As empresas decidiram constituir uma solução de DW para gerenciar os dados históricos de forma integrada, permitindo tanto gerar os Relatórios Gerenciais globais, como para realizar análises de dados de modo unificado.
9. O seu grupo fará o papel de uma empresa de consultoria de TIC que tanto é responsável pelos sistemas operativos de UMA das empresas, como também foi a consultoria escolhida para construir: (i) a solução de DW integrado, (ii) os Relatórios Gerenciais Globais e (iii) Dashboards dos dados unificados para apoiar análises e tomada de decisões.
10. Para que esta tarefa não fique exaustiva, iremos nos restringir a integração apenas dos dados do sistema de negócio central das empresas, deixando de fora a modelagem dos sistemas auxiliares de RH, Compras, Fornecedores etc., ou seja, serão integrados no DW os dados dos sistemas de controle do cadastro de clientes, controle da frota de veículo, controle de reserva e locação de veículo e controle de pátio.
11. Assim, os conceitos do universo de discurso envolvidos são apenas cinco: cliente, veículos (frota), pátio, reservas e locações (ou aluguel)

## Relatórios Gerenciais Gerais

### a) Controle de pátio
Quantitativo de veículos no pátio por "grupo" e "origem". Pode haver agrupamento por marca do veículo, modelos e tipo de mecanização. Por "origem" entenda-se da frota da empresa dona do pátio, ou da frota das outras cinco empresas associadas.

### b) Controle das locações
Quantitativo de veículos alugados por "grupo", e dimensão de tempo de locação e tempo restante para devolução (quando ficarão disponíveis para nova locação)

### c) Controle de reservas
Quantas reservas por "grupo" de veículo (quais veículos os clientes desejam alugar) e "pátio" (onde os clientes desejam retirar os veículos), por tempo de retirada futura (reservas para a semana que vem, para o mês que vem etc.), e/ou tempo de duração das locações, e pelas cidades de origem dos clientes

### d) Grupos mais alugados
Quais os "grupos" de veículos mais alugados, cruzando, eventualmente, com a origem dos clientes

### e) Previsão de ocupação de pátio
A única análise a ser modelada será a previsão de ocupação de pátio, a ser feita por cadeia de Markov. Para realizar esta modelagem devemos ter matriz estocástica com os percentuais de movimentação da frota entre os pátios, ou seja, para cada pátio, levantar o percentual de veículo que retorna ao mesmo pátio de onde foi retirado e o percentual que é entregue em cada um dos outros pátios.

---

## Tarefas - Parte 1

1. Realizar o "Projeto do Banco de Dados" Relacional do sistema transacional de uma das empresas.
2. O projeto deve modelar os dados dos sistemas de Cadastro de Clientes, Controle de Frota de Veículos, Sistemas de Reserva, Sistema de acompanhamento de Locação, Sistema de Cobrança e de Controle de Pátio
3. O projeto deve apresentar o modelo conceitual, lógico e físico da base de dados, em SQL/DDL, utilizando qualquer dos padrões ANSI SQL a partir do SQL99 (SQL3)

## Especificação do Sistema Transacional

A Locadora possui uma frota de veículos. Cada veículo possui: grupo, ou categoria (que é uma classificação dada pela locadora para resumir a classe de luxo do veículo e a faixa de valor do aluguel por dia), placa, chassis e uma lista de acessórios e características próprias, tais como marca, modelo, cor, se tem ou não ar-condicionado, mecanização (manual ou automática), se tem cadeirinha para criança, ou bebê conforto, e demais dados técnicos como dimensões etc. Cada veículo tem um prontuário para acompanhar o estado de conservação, revisões e característica de rodagem e segurança (pressão dos pneus, nível de óleo etc.). Essas características são apresentadas aos clientes para nortear a escolha na hora da reserva, sendo que tudo se inicia pela escolha do grupo de veículos. Cada veículo também possui um conjunto de fotos associadas, sejam elas para propaganda, seja para acompanhar o estado de entrega e devolução dos veículos.

Os clientes (locatários) pode ser pessoas físicas e jurídicas. No caso de PJ os seus funcionários são individualizados para efeitos de controle do condutor do veículo junto as autoridades competentes. No detalhe dos motoristas, temos o número da Carteira Nacional de Habilitação – CNH, Categoria de Habilitação (para quais tipos de veículos o condutor está habilitado) e a data de expiração da CNH. Também considere os dados do cliente para realizar o contrato de locação e a sua cobrança.

O subsistema de reservas de veículo controla a frota disponíveis por data, com a finalidade de ofertar ao cliente as possibilidades para locação, dentro da janela de tempo escolhido pelo cliente para locação. A partir disso, o sistema pode controlar a fila de reserva por cada grupo de veículo, ou "tipo" de veículo em particular (por exemplo Fiat Argo S-design, automático, branco, com ar-condicionado, a locadora pode possuir dez deles na frota, uns alugados, outros com janelas de disponibilização (dias em que não possuem reserva confirmada). Também, pode controlar uma eventual fila de espera pelos veículos, em particular pelos tipos especiais de veículos (por exemplo, adaptado a cadeirante), que pode ter desistência.

O Subsistema de controle de locação, possui os dados de data e hora da retirada e devolução (prevista e realizada), pátio de saída e de chegada, além claro, dos dados do condutor (cliente), e veículo alugado (estado de entrega e de devolução). Também tem os dados das proteções adicionais contratadas junto a parte do seguro obrigatório básico, tais como, proteção de vidros e faróis, faixa de indenização maior etc. Todos esses dados são utilizados para ajustar a cobrança final (pois já pode ter havido uma cobrança inicial, baseada na realização de todos os prazos e condições inicialmente contratada).

---

## Resultados a serem entregues - Parte I

1. Um texto, em formato PDF, com toda a descrição do Projeto do Banco de Dados Relacional para uma das empresas, como todos os detalhes necessários para a construção (justificação) dos scripts SQL de Extração ETL.
2. Dicionário de Dados do Modelo do Banco de Dados, contendo as especificações das Restrições de Integridade (se houverem).
3. Uma figura do Modelo Conceitual (MER, MER Estendido, ou MOO/UML).
4. Um esquema do Modelo Lógico.
5. O script SQL/DDL do Modelo Físico do Banco de Dados, utilizando qualquer um dos padrões ANSI SQL a partir do SQL99 (SQL3).
6. Um link para um repositório GitHub contendo toda essa documentação e os scripts SQL.

**Observações:**
- A tarefa deve ser feita em grupo
- Os resultados devem ser postados por apenas um dos componentes do grupo
- Os demais postam apenas uma folha de rosto contendo a lista completa dos componentes do grupo (nomes completos e DRE) e o link para o GitHub
- TODOS os arquivos, PDF e scripts SQL, devem conter um "cabeçalho", ou folha de rosto, com a identificação clara do grupo (nomes e DRE)
