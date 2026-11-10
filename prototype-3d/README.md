# Capivara — O Segredo das Três Eras

## Protótipo 3D isolado

A experiência 3D está em `prototype-3d/` e não altera a página de produção na raiz do repositório.

### Abrir o protótipo

Depois de publicar uma prévia do branch, a página fica em `/prototype-3d/`. Para testar localmente, sirva a pasta por HTTP (não abra o HTML como arquivo local), pois o projeto usa ES Modules e Three.js via CDN.

### Controles

- Teclado: WASD ou setas para andar; Espaço para pular; Shift para correr.
- Celular: joystick virtual, botões PULAR, CORRER, CONVERSAR e ASSUSTAR.
- Câmera: Livre 360°, Terceira pessoa, Próxima e Cinematográfica; a última escolha fica salva.
- Painel de ajustes: qualidade gráfica econômica/equilibrada/alta/automática, pausa, visibilidade do HUD e contador de FPS.
- Qualidade automática: ajusta dinamicamente a resolução interna conforme o tempo médio dos quadros para equilibrar fluidez e nitidez.
- Preferências de som, câmera, HUD, FPS e qualidade persistidas localmente no navegador.
- Tecla Esc para pausar/retomar a aventura; os controles de movimento são limpos ao pausar.
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
- Terceiro capítulo no Cerrado brasileiro, com chapadas, veredas, ipês, buritis, capim-dourado, riacho, pólen ao vento e vegetação de campo.
- Missão do Cerrado: reunir cinco sementes douradas, ajudar o tamanduá-bandeira e registrar encontros com lobo-guará, seriema e tatu-canastra; os encontros são salvos localmente.
- Fauna do Cerrado com deslocamento, exploração de território e interação por proximidade.
- Sistema de paisagem sonora procedural com controle de ligar/desligar, sem arquivos externos de áudio.
- **Pacote de evolução visual (15 melhorias):** céu em gradiente atmosférico; disco solar com halo; nuvens móveis; textura procedural de solo; capim instanciado; flores silvestres; pedrinhas instanciadas; partículas de poeira/flutuantes; ondulações animadas no rio; sombras de maior resolução em desktop; densidade visual escalada para celulares; cauda detalhada da capivara; bigodes; movimento sutil das orelhas; piscadas naturais dos olhos. Os elementos de vegetação e atmosfera são adaptados ao bioma para manter a leitura visual do gelo e do Cerrado.
- Transição do vale glacial para o Cerrado após concluir o resgate do filhote e reunir os cinco cristais.
- Salvamento local de frutos, conversas, capítulos, cristais, sementes e ajuda ao tamanduá-bandeira.

### Limitações conhecidas

Este é um protótipo 3D em evolução, não um jogo final. A capivara e os animais usam geometria procedural, sem modelos GLB nem animações profissionais; física, colisões e rotinas de fauna são simplificadas. O áudio atual é uma paisagem sonora sintetizada pelo navegador, não gravações ambientais ou trilha original. O progresso fica no armazenamento local do navegador, sem sincronização entre dispositivos. O jogo depende de conexão com a internet para carregar Three.js pelo CDN. Os animais do Cerrado usam rotinas simples de deslocamento e observação, não simulação ecológica completa. Os pássaros e borboletas são elementos ambientais simples, não fauna com IA ou rotinas ecológicas completas.

O renderizador reduz antialiasing, sombras e resolução interna em telas de toque para favorecer aparelhos modestos. A movimentação usa aceleração e desaceleração suaves, e os controles são pausados durante diálogos e quando a aba perde foco. A compatibilidade e o desempenho ainda precisam ser verificados em aparelhos reais, especialmente no Samsung A07. O branch é de desenvolvimento e não foi mesclado à produção nem implantado no Cloudflare.

## Próximos marcos

1. Trocar geometria procedural por modelos 3D otimizados e animações próprias.
2. Melhorar colisões, navegação dos animais e interação ambiental.
3. Criar trilha e efeitos sonoros originais por bioma.
4. Testar desempenho, acessibilidade e controles em Android e desktop reais.
5. Validar uma prévia separada antes de qualquer troca da produção.
