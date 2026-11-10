# Capivara — O Segredo das Duas Eras

## Protótipo 3D isolado

A experiência 3D está em `prototype-3d/` e não altera a página de produção na raiz do repositório.

### Abrir o protótipo

Depois de publicar uma prévia do branch, a página fica em `/prototype-3d/`. Para testar localmente, sirva a pasta por HTTP (não abra o HTML como arquivo local), pois o projeto usa ES Modules e Three.js via CDN.

### Controles

- Teclado: WASD ou setas para andar; Espaço para pular; Shift para correr.
- Celular: joystick virtual, botões PULAR, CORRER, CONVERSAR e ASSUSTAR.
- Câmera: Livre 360°, Terceira pessoa, Próxima e Cinematográfica.
- Mouse/toque: arraste para orbitar e use roda/pinça para zoom nos modos interativos.

### Conteúdo implementado nesta etapa

- Cena 3D Three.js com iluminação, sombras adaptadas ao dispositivo, névoa e terreno amazônico.
- Capivara 3D construída com geometria procedural, com animação simples de patas e corpo.
- Trilha, rio, árvores, folhagem, pedras, tronco caído e frutos colecionáveis.
- Movimento, corrida, salto, limites da área e colisões simples com obstáculos.
- Sistema de quatro câmeras em `src/camera/CameraDirector.js`.
- Interface responsiva para desktop e celular.
- Vida ambiente leve: pássaros em voo, borboletas, ciclo de iluminação dia/noite e chuva instanciada com qualidade reduzida em telas pequenas.
- Companheiros originais Tico (preguiça), Brasa (felino-dentes-de-sabre) e Bento (mamute jovem), com aproximação e diálogos; Tico acompanha a capivara.
- Missão de coleta dos oito frutos e portal ancestral que exige conversar com Tico para ser ativado.
- Primeira transição jogável para a Era Glacial, com montanhas, lago congelado, pinheiros nevados, neve em movimento e missão para encontrar cinco cristais ancestrais.
- Dois lobos-das-neves com patrulha, perseguição e ataque; a capivara pode correr, pular e assustá-los duas vezes para afastá-los. O HUD mostra vidas.
- Família de mamutes na Era Glacial: encontre o filhote perdido e pressione E ou CONVERSAR para reuni-lo à mãe; o filhote passa a acompanhar o adulto e o resgate fica salvo.
- Objetivo glacial integrado: reunir os cinco cristais e resgatar o filhote; o HUD prioriza a tarefa pendente e reconhece a conclusão do vale quando as duas metas forem cumpridas.
- Salvamento local de frutos, conversas, desbloqueio do capítulo glacial e cristais ancestrais coletados.

### Limitações conhecidas

Este é um primeiro protótipo jogável, não o jogo final. A capivara ainda usa geometria procedural, sem modelo GLB nem animações profissionais; a física e as colisões são simplificadas; o sistema de vidas e progressão ainda não está completo; não há áudio, combate ou uma campanha completa. O progresso local cobre a coleta, conversas e o desbloqueio do capítulo; ainda não há sincronização entre dispositivos nem um mapa glacial com missões próprias. A transição atual é uma primeira região demonstrativa do segundo capítulo, ainda sem fauna glacial variada; há lobos-das-neves e uma família de mamutes com missão de resgate, além da coleta de cinco cristais. Os pássaros e borboletas são elementos ambientais simples, não fauna com IA ou rotinas ecológicas completas. O protótipo depende de conexão com a internet para carregar Three.js do CDN.

A compatibilidade e o desempenho ainda precisam ser verificados em aparelhos reais, especialmente no Samsung A07. O branch é de desenvolvimento e não foi mesclado à produção nem implantado no Cloudflare.

## Próximos marcos

1. Melhorar personagem, animações e colisões.
2. Adicionar missões, NPCs originais e inimigos.
3. Criar transição narrativa para o mundo glacial.
4. Otimizar qualidade adaptativa e testar toque/desempenho em Android.
5. Só então preparar uma prévia separada para validação antes de qualquer troca da produção.
