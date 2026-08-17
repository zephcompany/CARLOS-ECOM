/* ==========================================================================
     CONFIGURAÇÃO CENTRAL DA LOJA
     --------------------------------------------------------------------------
     Itens marcados CONFIG no escopo (1.2, 1.4, 1.6, 1.8) precisam ser
     configuráveis no admin. Como o wireframe é um site estático e não tem
     painel, todos os valores ficam centralizados aqui: troca-se em um lugar só.
     Ao migrar para plataforma (item 4.1), estes valores viram campos do admin.
     ========================================================================== */
  const CONFIG = {
    /* --- 1.1 / 1.4 oferta de fardo (mecânica de produto) --- */
    fardo:{
      unidades:6,            // leve 6
      pagas:5,               // pague 5  (desconto de 16,7%)
      misto:true,            // PENDENTE DIRETORIA: fardo fechado (mesmo sabor) ou misto
      caixa12AplicaDuasVezes:null  // PENDENTE DIRETORIA (item 2.7): pagar 10 de 12?
    },

    /* --- 1.4 cupom (família separada, teto de 10%) --- */
    cupom:{ tetoPct:0.10, usoUnicoPorCPF:true },

    /* --- 1.3 / 1.5 nunca somar descontos --- */
    descontosCumulativos:false,   // NÃO ALTERAR sem aval da diretoria

    /* --- 1.6 Pix: entra desligado --- */
    pix:{ ativo:false, pct:0.05 },

    /* --- 1.2 frete --- */
    frete:{
      gratisAcimaDe:100,          // era R$ 99
      gratisSomenteNormal:true,   // expressa é sempre paga, sem exceção
      valorNormal:14.90,          // LOTE 2: valor real a definir
      valorExpressa:19.90,        // LOTE 2: valor real a definir
      prazoNormal:'Prazo a definir (lote 2)',
      prazoExpressa:'Prazo a definir (lote 2)'
    },

    /* --- 1.7 order bump do carrinho --- */
    bump:{ id:'p11', preco:5.90, liberaAcimaDe:80 },

    /* --- 1.8 contador da oferta --- */
    oferta:{
      dataFim:null,               // ex.: '2026-08-31T23:59:59' para data fixa
      cicloSemanalReiniciaEm:1    // 1 = segunda-feira 00:00 (ciclo real, não por sessão)
    },

    /* --- 1.9 parcelamento --- */
    parcelamento:{ maxParcelas:6, parcelaMinima:5, semJuros:true }
  };

  /* ==========================================================================
     3.1 — ARQUITETURA MODULAR POR MARCA
     Cada marca é um bloco isolado (identidade, domínio, categorias, coleção).
     Nada de marca fica acoplado ao tema: para separar a Vittari em loja própria
     (aguavittari.com.br), basta desligar `naLojaMulti` e apontar o domínio.
     ========================================================================== */
  const MARCAS = {
    agua:      { slug:'vittari',       dominio:'aguavittari.com.br',      cor:'#0F6FBF', naLojaMulti:true, ordem:1 },
    energetico:{ slug:'power-energy',  dominio:null,                      cor:'#FF9A0C', naLojaMulti:true, ordem:2 },
    sucos:     { slug:'natural-health',dominio:'suconaturalhealth.com.br',cor:'#03591A', naLojaMulti:true, ordem:3 }
  };

  /* --- 3.4 canais de atendimento reais --- */
  const CONTATO = {
    whatsapp:'(62) 99406-4911',
    whatsappLink:'https://wa.me/5562994064911',
    email:'sac@suconaturalhealth.com.br',
    razaoSocial:'Natural Mais Indústria e Comércio, Importação e Exportação Ltda',
    cnpj:'30.787.205/0001-20',
    cidade:'Aparecida de Goiânia, GO'
  };

  /* ================= CATÁLOGO ================= */
  const BRANDS = {
    agua:{name:'Água Vittari', kicker:'Vittari', tag:'Água com gás saborizada',
      desc:'Zero calóricas, zero açúcar e aroma natural.', vol:'355ml', selo:'Sem açúcar',
      sizes:['355ml'], nosugar:true, logo:'https://ketgroisman.com.br/wp-content/uploads/2026/07/ChatGPT-Image-15-de-jul.-de-2026-00_54_19-3.png'},
    energetico:{name:'+Power Energy', kicker:'+Power Energy', tag:'Energético',
      desc:'Energéticos para foco e disposição, com e sem açúcar.', vol:'269ml',
      sizes:['269ml'], logo:'https://ketgroisman.com.br/wp-content/uploads/2026/07/ChatGPT-Image-15-de-jul.-de-2026-00_54_19-2-1.png'},
    sucos:{name:'Suco Natural Health+', kicker:'Natural Health+', tag:'Sucos naturais sem açúcar adicionado',
      desc:'100% suco, adoçado apenas com suco de maçã. Sem açúcar adicionado e sem conservantes.', vol:'300ml', selo:'Sem açúcar adicionado',
      sizes:['180ml','300ml','600ml','900ml'], nosugar:true, logo:'https://ketgroisman.com.br/wp-content/uploads/2026/07/ChatGPT-Image-15-de-jul.-de-2026-00_54_19-4.png'}
  };

  // Catálogo real vindo dos produtos cadastrados na Shopify.
  const CATALOG=(window.NH_SHOPIFY_PRODUCTS||[]).filter(p=>p&&p.variantId).map(p=>({
    ...p,
    price:(Number(p.priceCents)||0)/100,
    old:p.compareAtCents?Number(p.compareAtCents)/100:null,
    semPreco:false
  }));
  const IMG=Object.fromEntries(CATALOG.map(p=>[p.id,p.img||'']));
  const IMG_HOVER=Object.fromEntries(CATALOG.map(p=>[p.id,p.imgHover||'']));
  const byId=id=>CATALOG.find(p=>p.id===id);
  const byBrand=k=>CATALOG.filter(p=>p.brand===k);

  const HEART='<svg viewBox="0 0 24 24" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21.4l8.8-8.4a5.2 5.2 0 0 0 0-7.4z"/></svg>';
  const WISH=new Set();

  function fmt(n){return 'R$ '+n.toFixed(2).replace('.',',');}
  /* 1.9 — parcelamento padronizado: até 6x sem juros, parcela mínima R$ 5.
     Abaixo da parcela mínima, o parcelamento não é anunciado. */
  function parcelas(v){
    if(!v)return null;
    const n=Math.min(CONFIG.parcelamento.maxParcelas,Math.floor(v/CONFIG.parcelamento.parcelaMinima));
    return n>=2?{n:n,v:v/n}:null;
  }
  function instTxt(v){const p=parcelas(v);return p?('ou '+p.n+'x de '+fmt(p.v)+' sem juros'):'';}
  function starsInner(n){let s='';for(let i=0;i<5;i++)s+=`<i class="${i<n?'':'o'}"></i>`;return s;}
  function star(n){return `<span class="stars">${starsInner(n)}</span>`;}
  function fill(id,list){const el=document.getElementById(id);if(el)el.innerHTML=list.join('');}
  function productImgTag(p,cls,alt){
    if(!p)return '';
    const src=p.img||p.imgHover||'';
    if(!src)return '';
    const fallback=(p.imgHover&&p.imgHover!==src)?p.imgHover:'';
    return `<img${cls?` class="${cls}"`:''} src="${src}" data-fallback="${fallback}" alt="${alt||p.name||''}" loading="lazy" onerror="if(this.dataset.fallback&&this.src!==this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback=''}else{this.style.display='none'}">`;
  }
  function productThumb(p,cls){return `<span class="${cls||'cart-thumb'}">${productImgTag(p,'',p.name)}</span>`;}


  /* ================= CONTEÚDO DAS LPs DE CATEGORIA ================= */
  const CB='https://ketgroisman.com.br/wp-content/uploads/2026/07/';
  const IC={
    leaf:'<path d="M4.5 19.5c-1.5-6 2-12.5 15-14-1 12-6.5 16-11.5 15.2"/><path d="M4 20c3-5.5 6.5-8.5 11-10.5"/>',
    drop:'<path d="M12 3.5s6 6.2 6 10.1a6 6 0 0 1-12 0c0-3.9 6-10.1 6-10.1z"/>',
    bolt:'<path d="M13 2L4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5z"/>',
    shield:'<path d="M12 3l7 3v5.2c0 4.4-3 7.5-7 8.8-4-1.3-7-4.4-7-8.8V6l7-3z"/><path d="M8.8 12.1l2.2 2.2 4.3-4.3"/>',
    heart:'<path d="M20.8 5.6a5.2 5.2 0 0 0-7.4 0L12 7l-1.4-1.4a5.2 5.2 0 1 0-7.4 7.4L12 21.4l8.8-8.4a5.2 5.2 0 0 0 0-7.4z"/>',
    sparkle:'<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.4L12 3z"/>',
    truck:'<rect x="2" y="7" width="12" height="9" rx="1"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18.5" r="1.6"/><circle cx="17" cy="18.5" r="1.6"/>',
    box:'<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5"/><path d="M12 12v9"/>',
    clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/>',
    moon:'<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>',
    dumbbell:'<path d="M3 9v6M6.5 7v10M17.5 7v10M21 9v6M6.5 12h11"/>',
    cup:'<path d="M5 8h12l-1 10.5a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 8z"/><path d="M17 10h2.2a2 2 0 0 1 0 4H16.7"/>',
    no:'<circle cx="12" cy="12" r="8.5"/><path d="M6 18L18 6"/>'
  };

  const CATLP={
    agua:{
      hero:CB+'vittariwater_1774798205_3863609651299930128_70935677700.jpg',
      faixa:'Zero açúcar · Zero caloria',
      title:'Sede de verdade pede Vittari',
      sub:'Água com gás e sabor natural de fruta. Toda a refrescância que você quer, sem uma única caloria — para beber o dia inteiro sem culpa nenhuma.',
      chips:['0 caloria','0 açúcar','Aroma natural','355ml'],
      benefits:[['drop','Zero calorias','Beba à vontade, sem pesar'],['leaf','Aroma natural','Sabor de fruta de verdade'],['no','Sem açúcar','Nada de adoçante escondido'],['truck','Entrega nacional','Chega gelada na sua rotina']],
      prodEyebrow:'3 sabores',
      prodTitle:'Escolha a sua Vittari',
      prodSub:'Três sabores cítricos e frutados, todos com a mesma promessa: zero açúcar, zero caloria e gás na medida certa.',
      whyEyebrow:'Por que Vittari',
      whyTitle:'A troca inteligente do refrigerante',
      why:[
        ['no','Zero em tudo que importa','Sem açúcar, sem caloria e sem adoçante artificial de gosto residual. A doçura vem do aroma natural da fruta.'],
        ['drop','Gás na medida','Borbulha o suficiente para refrescar, leve o suficiente para você beber a garrafa inteira sem estufar.'],
        ['leaf','Aroma natural','Cada sabor parte de aroma natural de fruta — nada de essência artificial puxando para o doce.'],
        ['heart','Hidrata de verdade','No fim das contas, é água. Você troca o refrigerante sem trocar a hidratação.'],
        ['sparkle','Sem culpa no rótulo','Lista de ingredientes curta e legível. O que está escrito é o que tem dentro.'],
        ['box','Fácil de repor','Compre em pack e tenha sempre gelada na geladeira por menos por unidade.']
      ],
      detailTitle:'Cada sabor por dentro',
      when:[['sun','No calor do dia','Quando bater aquela sede às 15h e você não quer mais um café.'],['cup','No lugar do refrigerante','Mesma sensação de borbulha, sem o açúcar do refri.'],['dumbbell','Depois do treino','Repõe líquido sem adicionar caloria ao seu dia.'],['moon','Naquele happy hour','Ótima base para drinks sem álcool ou para beber puro, com gelo e limão.']],
      specsTitle:'Transparência no rótulo',
      specsSub:'Sem letrinha miúda: é isso que você encontra em cada lata de 355ml.',
      specs:[['Volume','355ml'],['Calorias','0 kcal'],['Açúcares','0 g'],['Sódio','Baixo'],['Gaseificada','Sim'],['Aroma','Natural']],
      reviews:[
        ['Marina A.','São Paulo, SP','Troquei o refrigerante da tarde pela Vittari e não senti falta. O gás é bom e o sabor não é aguado como outras águas saborizadas.'],
        ['Rafael C.','Belo Horizonte, MG','Compro o pack e deixo na geladeira do escritório. Zero caloria e ainda mata a vontade de doce.'],
        ['Juliana P.','Curitiba, PR','O de limão siciliano é o meu favorito. Cítrico de verdade, não aquele gosto artificial.']
      ],
      faq:[
        ['A Vittari tem adoçante?','Não. O sabor vem de aroma natural de fruta, sem açúcar e sem adoçante artificial — por isso não deixa aquele gosto residual.'],
        ['Realmente tem zero caloria?','Sim. São 0 kcal e 0g de açúcares por lata de 355ml.'],
        ['Precisa tomar gelada?','Fica muito melhor gelada, mas pode ser guardada em temperatura ambiente até abrir.'],
        ['Posso usar em drinks?','Pode e recomendamos. Ela funciona muito bem como base de drinks sem álcool.'],
        ['Qual a validade?','12 meses a partir da fabricação, com a garrafa fechada.']
      ],
      ctaTitle:'Mude a bebida, não o seu dia',
      ctaSub:'Escolha seu sabor favorito e receba em casa. Frete grátis acima de R$ 100 na entrega normal.'
    },
    energetico:{
      hero:CB+'ChatGPT-Image-15-de-jul.-de-2026-00_50_01.png',
      faixa:'Energia de verdade · 269ml',
      title:'A energia que segura o seu dia',
      sub:'Cafeína e taurina na dose certa para foco e disposição — na versão tradicional ou zero açúcar, você escolhe como quer o seu gás.',
      chips:['Cafeína + taurina','269ml','Versão zero','Foco imediato'],
      benefits:[['bolt','Foco rápido','Disposição quando você mais precisa'],['clock','Dura o turno','Energia estável, sem queda brusca'],['no','Zero açúcar só na versão Zero','O Tradicional é reduzido em açúcar'],['truck','Sempre em estoque','Compre em pack e nunca fique sem']],
      prodEyebrow:'2 versões',
      prodTitle:'Tradicional ou Zero Açúcar',
      prodSub:'Mesma fórmula de energia, duas pegadas: o clássico encorpado ou o zero açúcar para quem controla o consumo.',
      whyEyebrow:'Por que +Power Energy',
      whyTitle:'Feito para quem não pode desacelerar',
      why:[
        ['bolt','Dose que funciona','Cafeína e taurina em quantidade pensada para dar foco de verdade, não só um empurrãozinho.'],
        ['clock','Sem o baque depois','Formulado para segurar a energia ao longo do turno em vez de te derrubar em uma hora.'],
        ['no','Zero açúcar na versão Zero','A versão Zero Açúcar mantém sabor e energia sem nenhum açúcar. O Tradicional é reduzido em açúcar, não zero.'],
        ['sparkle','Sabor que desce fácil','Gelado, é refrescante o suficiente para você tomar rápido antes do treino ou do plantão.'],
        ['box','Preço por lata melhor','Comprando em pack, o custo por lata cai bastante em relação à unidade.'],
        ['shield','Consumo consciente','Rótulo claro sobre cafeína, para você saber exatamente o que está tomando.']
      ],
      detailTitle:'As duas versões por dentro',
      when:[['dumbbell','Antes do treino','Tome de 20 a 30 minutos antes para pegar o pico de disposição.'],['moon','No plantão ou madrugada','Para quem vira noite trabalhando, estudando ou dirigindo.'],['clock','Na virada da tarde','Aquela queda das 15h que nenhum café resolve.'],['bolt','Antes do jogo','Games, campeonatos e qualquer coisa que exija reação rápida.']],
      specsTitle:'O que tem em cada lata',
      specsSub:'Informação direta, sem enrolação — vale para as duas versões, salvo o açúcar.',
      specs:[['Volume','269ml'],['Cafeína','Sim'],['Taurina','Sim'],['Versão zero','0g de açúcar'],['Tradicional','Reduzido em açúcar'],['Gaseificado','Sim']],
      reviews:[
        ['Diego R.','Recife, PE','Trabalho em plantão e o +Power Energy segura bem a madrugada. O zero é o que eu mais compro.'],
        ['Camila S.','Porto Alegre, RS','Tomo antes do treino. Dá disposição sem aquele nervosismo de outros energéticos.'],
        ['Bruno M.','Salvador, BA','Comprei o pack e saiu bem mais barato que na conveniência. Chegou rápido.']
      ],
      faq:[
        ['Qual a diferença entre o tradicional e o zero?','A energia é a mesma. O tradicional é reduzido em açúcar e o Zero Açúcar não tem açúcar nenhum — a escolha é de sabor e de dieta.'],
        ['Quanta cafeína tem?','A lata de 269ml traz cafeína em dose comparável à de um café forte. O rótulo detalha a quantidade exata.'],
        ['Posso tomar antes de treinar?','Sim, é um dos usos mais comuns. O ideal é de 20 a 30 minutos antes.'],
        ['Crianças e gestantes podem consumir?','Não é recomendado para crianças, gestantes, lactantes nem pessoas sensíveis à cafeína.'],
        ['Vem em outro tamanho?','Hoje trabalhamos com a lata de 269ml nas duas versões. Novos formatos entram no site assim que lançados.']
      ],
      ctaTitle:'Escolha o seu gás',
      ctaSub:'Tradicional ou zero açúcar — monte seu fardo e receba em casa com frete grátis acima de R$ 100 na entrega normal.'
    },
    sucos:{
      hero:CB+'ChatGPT-Image-15-de-jul.-de-2026-00_49_58.png',
      faixa:'Sem açúcar adicionado · 100% suco',
      title:'Suco de fruta, do jeito que deveria ser',
      sub:'100% suco, adoçado apenas com suco de maçã. Sem açúcar adicionado, sem conservantes e sem corante — para você e para a família toda.',
      chips:['Sem açúcar adicionado','100% suco','Sem conservantes','180ml a 900ml'],
      benefits:[['leaf','Fruta de verdade','Sabor que vem da fruta, não do xarope'],['no','Sem açúcar adicionado','Adoçado apenas com suco de maçã'],['heart','Para a família','Bom para as crianças e para você'],['box','Vários tamanhos','180ml, 300ml, 600ml ou 900ml']],
      prodEyebrow:'5 sabores',
      prodTitle:'Escolha a sua fruta',
      prodSub:'Cinco sabores clássicos brasileiros: 100% suco, adoçados apenas com suco de maçã e sem conservantes.',
      whyEyebrow:'Por que Natural Health+',
      whyTitle:'A diferença está no que a gente não coloca',
      why:[
        ['no','Sem açúcar adicionado','100% suco, adoçado apenas com suco de maçã. A doçura vem da própria fruta — suco de fruta sempre contém o açúcar natural dela.'],
        ['leaf','Sem conservantes','Nada de conservante ou corante artificial na lista de ingredientes.'],
        ['heart','Aprovado pelas crianças','Sabor que agrada os pequenos e deixa os pais tranquilos com o rótulo.'],
        ['sparkle','Rótulo curto','Se você não consegue ler a lista de ingredientes em voz alta, tem algo errado. A nossa é curta.'],
        ['box','Tamanho para cada momento','180ml infantil para a lancheira, 300ml para levar, 600ml para o dia e 900ml para a mesa da família.'],
        ['truck','Direto na sua casa','Você repõe a despensa sem depender do que o mercado tem na prateleira.']
      ],
      detailTitle:'Cada fruta por dentro',
      when:[['sun','No café da manhã','Para começar o dia com fruta de verdade em vez de açúcar.'],['cup','Na lancheira','Tamanho 300ml vai fácil na mochila da escola.'],['heart','No almoço em família','A garrafa de 900ml rende para todo mundo à mesa.'],['dumbbell','Depois da atividade','Carboidrato natural da fruta para repor a energia gasta.']],
      specsTitle:'O que tem — e o que não tem',
      specsSub:'A lista curta é o ponto: 100% suco, adoçado apenas com suco de maçã, e o mínimo necessário para ele chegar até você.',
      specs:[['Volumes','180ml · 300ml · 600ml · 900ml'],['Açúcar adicionado','0 g'],['Adoçado com','Suco de maçã'],['Conservantes','Não contém'],['Corantes','Não contém'],['Fruta','Ingrediente principal'],['Validade','12 meses fechado']],
      reviews:[
        ['Juliana P.','Curitiba, PR','Meus filhos adoram e eu fico tranquila lendo o rótulo. O de uva é o campeão aqui em casa.'],
        ['Anderson L.','Fortaleza, CE','Comprei o de caju sem esperar muito e virou o meu preferido. Gosto de fruta mesmo.'],
        ['Priscila N.','Goiânia, GO','Uso o de laranja no café da manhã. Sem açúcar e ainda assim doce na medida.']
      ],
      faq:[
        ['O suco tem açúcar?','Não tem açúcar adicionado. É 100% suco, adoçado apenas com suco de maçã — o açúcar presente é o natural da própria fruta.'],
        ['Tem conservantes ou corantes?','Não. A lista de ingredientes é curta justamente por isso.'],
        ['Crianças podem tomar?','Sim. É uma das razões de não adicionarmos açúcar nem corante.'],
        ['Precisa refrigerar?','Antes de abrir, não. Depois de aberto, mantenha na geladeira e consuma em até 3 dias.'],
        ['Quais tamanhos existem?','180ml infantil, 300ml, 600ml e 900ml — escolha na página do produto.']
      ],
      ctaTitle:'Fruta de verdade na sua mesa',
      ctaSub:'Escolha seus sabores favoritos e receba em casa. Frete grátis acima de R$ 100 na entrega normal.'
    }
  };

  /* copy por produto (blocos "cada sabor por dentro") */
  const PCOPY={
    p1:['Cítrico e afiado','O limão siciliano é o mais cítrico da linha: seco, refrescante e com aquele amargor elegante no fim. É o sabor que mais lembra uma água tônica leve — perfeito para quem não gosta de bebida doce.','Ideal para o calor, para acompanhar comida e como base de drinks.'],
    p2:['Doce na medida','Frutas vermelhas traz um perfil mais redondo e aromático, sem virar refrigerante. É o sabor que costuma converter quem acha água com gás pura sem graça.','Boa porta de entrada se você está saindo do refrigerante agora.'],
    p4:['Leve e diferente','Maçã verde entrega um sabor levemente ácido e muito aromático. É o mais inesperado dos três e vira favorito de quem já está acostumado com água saborizada.','Combina com dias quentes e com quem quer fugir do óbvio.'],
    p7:['O clássico encorpado','A versão Tradicional é a que a maioria conhece e procura: sabor marcante, gás firme e a dose de cafeína e taurina que dá o empurrão que você espera de um energético.','Açúcar reduzido, mantendo o sabor original. O selo de zero açúcar vale apenas para a versão Zero.'],
    p11:['Toda a energia, zero açúcar','Mesma proposta de foco e disposição, sem nenhum açúcar. Para quem controla a dieta mas não abre mão do energético antes do treino ou do plantão.','O mais vendido entre quem consome com frequência.'],
    p13:['O mais pedido da casa','Laranja é o suco que agrada todo mundo: doce natural, ácido leve e aquele sabor de café da manhã. Sem açúcar adicionado, o gosto é o da própria fruta.','Perfeito para o café da manhã e para a lancheira das crianças.'],
    p14:['Intenso e encorpado','A uva tem a doçura mais marcante da linha, e mesmo assim sem açúcar adicionado. É o preferido das crianças e o que mais some da geladeira.','Ótimo na garrafa de 900ml para a mesa da família.'],
    p15:['Cremoso e tropical','A goiaba entrega um suco mais encorpado, quase aveludado, com aquele sabor tropical que lembra fruta madura de verdade.','Vai bem no lanche da tarde e como sobremesa leve.'],
    p16:['Azedinho na medida','Maracujá é o mais ácido dos cinco, com aquele aroma inconfundível. Sem açúcar adicionado, ele preserva o azedinho que faz o sabor.','Ótimo gelado no fim do dia e para acompanhar comida.'],
    s900:['A garrafa da mesa','O formato de 900ml é o de compartilhar: rende para a família toda no almoço e economiza idas ao mercado. Mesmo suco, mesma promessa — 100% suco, adoçado apenas com suco de maçã.','Formato já no catálogo real. Preço entra no lote 2.'],
    s180:['O tamanho da lancheira','A garrafinha de 180ml foi feita para a criança levar para a escola: porção certa, fácil de segurar e sem açúcar adicionado.','Formato já no catálogo real. Preço entra no lote 2.'],
    p18:['O sabor da região','Caju é o mais brasileiro da linha: adstringente na medida, aromático e diferente de tudo. Quem é do Nordeste reconhece na primeira golada.','Para quem quer sair do óbvio e provar fruta de verdade.']
  };


  /* ================= AVATARES (retratos ilustrados) ================= */
  const AV_SKIN=['#F2C9A6','#E0AC82','#C68A62','#A36A45','#7A4B2E','#F5D5B8'];
  const AV_HAIR=['#2B1B12','#4A2E1D','#7A4A22','#1A1A1A','#5C4033','#8A6A3E'];
  const AV_TOP=['#03591A','#FF9A0C','#0F4C36','#2E5E4A','#C2410C','#1F3A2E'];
  function avatarSVG(seed,fem){
    let h=0;for(let i=0;i<seed.length;i++)h=(h*31+seed.charCodeAt(i))>>>0;
    const sk=AV_SKIN[h%AV_SKIN.length],hr=AV_HAIR[(h>>3)%AV_HAIR.length],tp=AV_TOP[(h>>6)%AV_TOP.length];
    const female=(fem===undefined)?((h>>9)&1):(fem?1:0);
    const bg=['#EAF1EC','#F4EBDF','#E8EEF4','#F3EDF6'][(h>>11)%4];
    const hair=female
      ? `<path d="M18 34c0-10 6-17 14-17s14 7 14 17c0 6-1 10-2 13 1-9-3-14-6-16-3 3-9 5-14 4-3 2-5 6-4 12-1-3-2-7-2-13z" fill="${hr}"/>
         <path d="M17 36c-2 8-1 16 2 22 1-8 0-15-1-22z" fill="${hr}"/>
         <path d="M47 36c2 8 1 16-2 22-1-8 0-15 1-22z" fill="${hr}"/>`
      : `<path d="M19 33c0-9 6-16 13-16s13 7 13 16c0 2 0 4-1 5 0-6-4-9-8-9-5 0-9 1-12 4-2 2-4 3-4 6-1-2-1-4-1-6z" fill="${hr}"/>`;
    const acc=female?`<circle cx="20" cy="42" r="2" fill="${hr}"/><circle cx="44" cy="42" r="2" fill="${hr}"/>`:'';
    return `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/>`+
      `<path d="M32 58c-9 0-16 3-19 6h38c-3-3-10-6-19-6z" fill="${tp}"/>`+
      `<path d="M14 64c2-8 9-13 18-13s16 5 18 13z" fill="${tp}"/>`+
      `<rect x="27" y="42" width="10" height="12" rx="5" fill="${sk}"/>`+
      `<ellipse cx="32" cy="35" rx="13" ry="15" fill="${sk}"/>`+
      hair+
      `<ellipse cx="27" cy="35" rx="1.5" ry="2" fill="#2A2A2A"/><ellipse cx="37" cy="35" rx="1.5" ry="2" fill="#2A2A2A"/>`+
      `<path d="M28.5 41.5c1.6 1.4 5.4 1.4 7 0" stroke="#8A5A44" stroke-width="1.4" fill="none" stroke-linecap="round"/>`+
      acc+`</svg>`)}`;
  }
  // Fotos reais de bancos de imagem gratuitos (Unsplash/Pixabay)
  const REAL_AVATARS={
    'Marina Alves':'https://images.unsplash.com/photo-1745434159123-5b99b94206ca?auto=format&fit=crop&w=420&h=420&q=82',
    'Marina A.':'https://images.unsplash.com/photo-1745434159123-5b99b94206ca?auto=format&fit=crop&w=420&h=420&q=82',
    'Rafael Costa':'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?auto=format&fit=crop&w=420&h=420&q=82',
    'Rafael C.':'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?auto=format&fit=crop&w=420&h=420&q=82',
    'Juliana Prado':'https://images.unsplash.com/photo-1701096351544-7de3c7fa0272?auto=format&fit=crop&w=420&h=420&q=82',
    'Juliana P.':'https://images.unsplash.com/photo-1701096351544-7de3c7fa0272?auto=format&fit=crop&w=420&h=420&q=82',
    'Diego Ramos':'https://images.unsplash.com/photo-1752650143052-fab46a8c2735?auto=format&fit=crop&w=420&h=420&q=82',
    'Diego R.':'https://images.unsplash.com/photo-1752650143052-fab46a8c2735?auto=format&fit=crop&w=420&h=420&q=82',
    'Camila Souza':'https://images.unsplash.com/photo-1769636930016-5d9f0ca653aa?auto=format&fit=crop&w=420&h=420&q=82',
    'Camila S.':'https://images.unsplash.com/photo-1769636930016-5d9f0ca653aa?auto=format&fit=crop&w=420&h=420&q=82',
    'Bruno Martins':'https://images.unsplash.com/photo-1769636929354-59165ba73c7e?auto=format&fit=crop&w=420&h=420&q=82',
    'Bruno M.':'https://images.unsplash.com/photo-1769636929354-59165ba73c7e?auto=format&fit=crop&w=420&h=420&q=82',
    'Anderson Lima':'https://images.unsplash.com/photo-1590735627513-59a186ed0984?auto=format&fit=crop&w=420&h=420&q=82',
    'Anderson L.':'https://images.unsplash.com/photo-1590735627513-59a186ed0984?auto=format&fit=crop&w=420&h=420&q=82',
    'Priscila Nunes':'https://cdn.pixabay.com/photo/2022/07/22/15/44/woman-7338402_1280.jpg',
    'Priscila N.':'https://cdn.pixabay.com/photo/2022/07/22/15/44/woman-7338402_1280.jpg',
    'Marcos Teixeira':'https://images.unsplash.com/photo-1769961982389-bb243681421a?auto=format&fit=crop&w=420&h=420&q=82',
    'Ana Ribeiro':'https://images.unsplash.com/photo-1758600587833-c07c5bda5c70?auto=format&fit=crop&w=420&h=420&q=82',
    'Carlos Dias':'https://images.unsplash.com/photo-1651684215020-f7a5b6610f23?auto=format&fit=crop&w=420&h=420&q=82',
    'Fernanda Lopes':'https://images.unsplash.com/photo-1745434159123-5b99b94206ca?auto=format&fit=crop&w=420&h=420&q=82',
    'Rogerio Melo':'https://images.unsplash.com/photo-1752650143052-fab46a8c2735?auto=format&fit=crop&w=420&h=420&q=82'
  };
  function avatarImg(name,fem,cls){
    const src=REAL_AVATARS[name]||avatarSVG(name,fem);
    return `<img class="${cls||'av-img'}" src="${src}" alt="${name}" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${avatarSVG(name,fem)}'">`;
  }

  /* ================= CARD ================= */
  function card(p,opts={}){
    const b=BRANDS[p.brand];
    const badgeText=opts.rank?('Nº '+opts.rank):(p.flag||'');
    const badge=badgeText?`<span class="pflag">${badgeText}</span>`:'';
    const old=p.old?`<s>${fmt(p.old)}</s>`:'';
    const won=WISH.has(p.id)?' on':'';
    const inst=p.semPreco?'<span class="inst">Preço definido no lote 2</span>'
      :(instTxt(p.price)?`<span class="inst">${instTxt(p.price)}</span>`:'');
    const priceRow=p.semPreco
      ? '<div class="price-row"><span class="now" style="font-size:15px">Preço em breve</span></div>'
      : `<div class="price-row">${old}<span class="now">${fmt(p.price)}</span></div>`;
    const buyRow=p.semPreco
      ? '<div class="buy-row"><button class="add" disabled style="opacity:.45;cursor:not-allowed" onclick="event.stopPropagation()">Em breve</button></div>'
      : `<div class="buy-row">
          <div class="qty-sm"><button onclick="stepCard(this,-1,event)">−</button><span>1</span><button onclick="stepCard(this,1,event)">+</button></div>
          <button class="add" onclick="addFromCard(this,'${p.id}',event)">Adicionar</button>
        </div>`;
    return `<div class="card" data-brand="${p.brand}" onclick="openProduct('${p.id}')">
      <div class="card-media">
        ${badge}
        <button class="wish${won}" onclick="toggleWish(this,'${p.id}',event)" aria-label="Favoritar">${HEART}</button>
        <div class="bottle"></div>
        <span class="media-label">${(b.kicker+' '+p.flavor).toUpperCase()}</span>
        ${p.img?`<img class="pimg" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">`:''}
        ${p.imgHover?`<img class="pimg pimg-hover" src="${p.imgHover}" alt="" loading="lazy" onerror="this.remove()">`:''}
      </div>
      <div class="card-body">
        <span class="kicker">${b.kicker}</span>
        <span class="name">${p.name}</span>
        <span class="vol">${p.flavor} · ${p.vol}</span>
        ${b.nosugar?`<span class="nosugar-tag">${b.selo||'Sem açúcar'}</span>`:''}
        <div class="rate">${star(p.stars)}<span class="rev">(${p.rev})</span></div>
        ${priceRow}
        ${inst}
        ${buyRow}
      </div>
    </div>`;
  }
  function stepCard(btn,d,ev){ev.stopPropagation();const s=btn.parentElement.querySelector('span');s.textContent=Math.max(1,(parseInt(s.textContent)||1)+d);}
  function addFromCard(btn,id,ev){ev.stopPropagation();const c=btn.closest('.card');const q=parseInt(c.querySelector('.qty-sm span').textContent)||1;addToCart(id,q);}
  function toggleWish(btn,id,ev){ev.stopPropagation();if(WISH.has(id)){WISH.delete(id);btn.classList.remove('on');}else{WISH.add(id);btn.classList.add('on');toast('Adicionado aos favoritos');}}

  /* ================= GRIDS ================= */
  function sortList(list,key){
    const a=list.slice();
    if(key==='menor')a.sort((x,y)=>x.price-y.price);
    else if(key==='maior')a.sort((x,y)=>y.price-x.price);
    else if(key==='vendidos')a.sort((x,y)=>y.rev-x.rev);
    else if(key==='avaliacao')a.sort((x,y)=>(y.stars-x.stars)||(y.rev-x.rev));
    return a;
  }
  function setActive(sel,btn){document.querySelectorAll(sel+' .btab').forEach(b=>b.classList.remove('on'));btn.classList.add('on');}
  function setTabsActive(sel,val){const map={todos:0,agua:1,energetico:2,sucos:3};document.querySelectorAll(sel+' .btab').forEach((b,i)=>b.classList.toggle('on',i===map[val]));}

  function renderGeral(f){const list=(f==='todos'?CATALOG.slice(0,8):byBrand(f));fill('grid-geral',list.map(p=>card(p)));}
  function filterGrid(f,btn){setActive('#brandtabs',btn);renderGeral(f);}
  function renderVend(f){const list=(f==='todos'?CATALOG.slice():byBrand(f)).sort((a,b)=>b.rev-a.rev).slice(0,8);fill('grid-vendidos',list.map((p,i)=>card(p,{rank:i+1})));}
  function filterVend(f,btn){setActive('#vendtabs',btn);renderVend(f);}
  function renderOferta(f){const list=(f==='todos'?CATALOG:byBrand(f));fill('grid-oferta',list.map(p=>card(p)));}
  function filterOferta(f,btn){setActive('#ofertatabs',btn);renderOferta(f);}

  // mais vendidos (página) com filtro + ordenação
  let rankState={f:'todos',sort:'vendidos'};
  function renderRankGrid(){let list=rankState.f==='todos'?CATALOG.slice():byBrand(rankState.f);list=sortList(list,rankState.sort);fill('grid-ranking',list.map((p,i)=>card(p,{rank:i+1})));}
  function filterRank(f,btn){rankState.f=f;setActive('#ranktabs',btn);renderRankGrid();}
  function rankSort(sel){rankState.sort=sel.value;document.getElementById('rank-sortlabel').textContent='Ordenar por: '+sel.options[sel.selectedIndex].text;renderRankGrid();}


  /* ================= RENDER DA LP DE CATEGORIA ================= */
  function svgIc(k,cls){return '<svg class="'+(cls||'')+'" viewBox="0 0 24 24">'+(IC[k]||'')+'</svg>';}
  function clpScroll(id){const e=document.getElementById(id);if(e)e.scrollIntoView({behavior:'smooth',block:'start'});}

  function renderCatLP(key){
    const d=CATLP[key], b=BRANDS[key];
    if(!d)return;
    const set=(id,v,html)=>{const e=document.getElementById(id);if(e){if(html)e.innerHTML=v;else e.textContent=v;}};

    // hero (banner desktop + mobile, sem cortar)
    const BAN={
      agua:[window.NH_ASSETS["nh-embedded-3e00f152a9.jpg"],window.NH_ASSETS["nh-embedded-d6368b5bf6.jpg"]],
      energetico:[window.NH_ASSETS["nh-embedded-9d9a6d2e1e.jpg"],window.NH_ASSETS["nh-embedded-c8d83f1f21.jpg"]],
      sucos:[window.NH_ASSETS["nh-embedded-d00b8bb93b.jpg"],window.NH_ASSETS["nh-embedded-92a8c23588.jpg"]]
    }[key]||[d.hero,d.hero];
    const hi=document.getElementById('clp-hero-img');
    const hs=document.getElementById('clp-hero-src');
    hi.dataset.d=BAN[0];hi.src=BAN[0];hi.alt=b.name;hi.style.display='block';
    if(hs)hs.srcset=BAN[1];
    const cl=document.getElementById('clp-logo');
    if(b.logo){cl.src=b.logo;cl.style.display='block';}else{cl.style.display='none';}
    set('clp-faixa',d.faixa);set('clp-title',d.title);set('clp-sub',d.sub);
    set('cat-crumb',b.name);
    set('clp-chips',d.chips.map(c=>`<span class="clp-chip">${c}</span>`).join(''),1);

    // benefícios
    set('clp-benefits',d.benefits.map(([ic,t,sub])=>
      `<div class="pm"><span class="pm-ic">${svgIc(ic)}</span><span><b>${t}</b><small>${sub}</small></span></div>`).join(''),1);

    // produtos
    set('clp-prod-eyebrow',d.prodEyebrow);set('clp-prod-title',d.prodTitle);set('clp-prod-sub',d.prodSub);

    // por que escolher
    set('clp-why-eyebrow',d.whyEyebrow);set('clp-why-title',d.whyTitle);
    set('clp-why',d.why.map(([ic,t,p])=>
      `<div class="clp-w"><span class="clp-w-ic">${svgIc(ic)}</span><h3 class="h3">${t}</h3><p>${p}</p></div>`).join(''),1);

    // produto a produto
    set('clp-detail-title',d.detailTitle);
    set('clp-details',byBrand(key).map((p,i)=>{
      const c=PCOPY[p.id]||['','',''];
      return `<div class="clp-detail${i%2?' rev':''}">
        <div class="clp-d-media">${p.img?`<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">`:'<span class="bottle"></span>'}</div>
        <div class="clp-d-txt">
          <span class="eyebrow">${b.kicker} · ${p.vol}</span>
          <h3 class="h2">${p.name}</h3>
          <p class="clp-d-lead">${c[0]}</p>
          <p>${c[1]}</p>
          <p class="muted">${c[2]}</p>
          <div class="clp-d-buy">
            <span class="clp-d-price">${p.semPreco?'Preço em breve':fmt(p.price)}</span>
            ${p.semPreco?'<button class="btn" style="opacity:.5;pointer-events:none">Em breve</button>':`<button class="btn" onclick="buyNow('${p.id}',1)">Comprar agora</button>`}
            <button class="btn ghost" onclick="openProduct('${p.id}')">Ver detalhes</button>
          </div>
        </div>
      </div>`;}).join(''),1);

    // momentos
    set('clp-when-title',key==='sucos'?'Bom em qualquer hora do dia':(key==='agua'?'A hora certa da Vittari':'Quando bater a necessidade'));
    set('clp-moments',d.when.map(([ic,t,p])=>
      `<div class="clp-m"><span class="clp-m-ic">${svgIc(ic)}</span><b>${t}</b><p>${p}</p></div>`).join(''),1);

    // ficha técnica
    set('clp-specs-title',d.specsTitle);set('clp-specs-sub',d.specsSub);
    set('clp-specs',d.specs.map(([k,v])=>`<div class="clp-sp"><span>${k}</span><b>${v}</b></div>`).join(''),1);
    const si=document.getElementById('clp-specs-img');
    const first=byBrand(key)[0];
    if(first&&first.img){si.src=first.img;si.style.display='block';}else{si.style.display='none';}

    // depoimentos
    set('clp-rev-title',key==='agua'?'Quem trocou o refrigerante':(key==='energetico'?'Quem usa todo dia':'O que as famílias dizem'));
    set('clp-reviews',d.reviews.map(([n,c,t])=>
      `<div class="quote">${star(5)}<p>"${t}"</p><div class="who"><span class="av2">${avatarImg(n)}</span><span><b>${n}</b><small>${c}</small></span></div></div>`).join(''),1);

    // faq
    set('clp-faq',d.faq.map(([q,a])=>
      `<div class="faq-item"><button class="qa" onclick="toggleFaq(this)"><b>${q}</b><span class="plus"></span></button>
       <div class="qa-a"><div><p>${a}</p></div></div></div>`).join(''),1);

    // cta
    set('clp-cta-title',d.ctaTitle);set('clp-cta-sub',d.ctaSub);

    // loja da categoria + combo
    renderShop(key);

    // registra o conteúdo recém-criado nas animações de entrada
    const root=document.getElementById('page-categoria');
    requestAnimationFrame(()=>{
      if(window.registerReveal)window.registerReveal(root);
      if(window.scanCounters)window.scanCounters(root);
      if(window.revealVisible)setTimeout(window.revealVisible,20);
    });
  }


  /* ---- loja da categoria + combo "compre 2, leve 3" ---- */
  const SHOP={
    agua:{eyebrow:'Leve para casa',title:'Escolha os seus sabores Vittari',
      sub:'Três sabores, a mesma refrescância sem açúcar. Monte sua caixa do jeito que você bebe.'},
    energetico:{eyebrow:'Abasteça sua rotina',title:'Escolha a sua +Power Energy',
      sub:'Tradicional ou zero açúcar — a mesma energia de 269ml, na versão que combina com você.'},
    sucos:{eyebrow:'Leve para casa',title:'Escolha seus sucos Natural Health+',
      sub:'Cinco sabores de fruta de verdade, 100% suco e sem açúcar adicionado. Leve os que a sua casa mais gosta.'}
  };
  let comboIds=[];
  function clpCard(p,i){
    const b=BRANDS[p.brand];
    const n=String(i+1).padStart(2,'0');
    const badge=p.flag?`<span class="clpc-badge">${p.flag}</span>`:'';
    const old=p.old?`<s>${fmt(p.old)}</s>`:'';
    const tag=b.nosugar?`<span class="clpc-tag">${b.selo||'Sem açúcar'}</span>`:'';
    return `<article class="clpc" onclick="openProduct('${p.id}')">
      ${p.img?`<img class="clpc-img" src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">`:''}
      ${p.imgHover?`<img class="clpc-img b" src="${p.imgHover}" alt="" loading="lazy" onerror="this.remove()">`:''}
      <span class="clpc-veil"></span>
      <span class="clpc-top"><span class="clpc-idx">${n}</span>${badge}</span>
      <div class="clpc-in">
        <h3 class="clpc-name">${p.flavor}</h3>
        <div class="clpc-meta"><span>${p.vol}</span>${tag}<span>★ ${p.stars}.0 (${p.rev})</span></div>
        <div class="clpc-foot">
          <span class="clpc-price">${p.semPreco?'Preço em breve':old+fmt(p.price)}</span>
          ${p.semPreco?'<button class="clpc-add" style="opacity:.5" onclick="event.stopPropagation()">Em breve</button>':`<button class="clpc-add" onclick="event.stopPropagation();buyNow('${p.id}',1)">Comprar agora</button>`}
        </div>
      </div>
    </article>`;
  }
  function renderShop(key){
    const list=byBrand(key);
    const sh=SHOP[key]||{};
    const set2=(id,v)=>{const e=document.getElementById(id);if(e)e.textContent=v;};
    set2('clp-shop-eyebrow',sh.eyebrow||'Leve para casa');
    set2('clp-shop-title',sh.title||('Escolha o seu '+BRANDS[key].kicker));
    set2('clp-shop-sub',sh.sub||'');
    const g=document.getElementById('clp-shop-grid');
    if(g)g.innerHTML=list.map((p,i)=>clpCard(p,i)).join('');
  }

  /* ================= CATEGORIA ================= */
  let catState={f:'agua',sort:'rel',pmin:0,pmax:15};
  function renderCatGrid(){
    const b=catState.f;
    let list=b==='todos'?CATALOG.slice():byBrand(b);
    list=list.filter(p=>p.price>=catState.pmin && (catState.pmax>=15 || p.price<=catState.pmax));
    list=sortList(list,catState.sort);
    fill('grid-categoria',list.map(p=>card(p)));
    const cc=document.getElementById('cat-count');
    if(cc)cc.textContent=list.length+' produtos';
    const crumb=document.getElementById('cat-crumb');
    if(crumb)crumb.textContent=(b==='todos')?'Todos os produtos':BRANDS[b].name;
    const g2=document.getElementById('grid-categoria2');
    if(g2)g2.innerHTML=list.map(p=>card(p)).join('');
    const c2=document.getElementById('cat-count2');
    if(c2)c2.textContent=list.length+' produtos';
    const keys=['agua','energetico','sucos'];
    document.querySelectorAll('#page-categoria .fgroup:first-child .fopt .fbox').forEach((box,i)=>box.classList.toggle('on',keys[i]===b));
    if(b!=='todos'&&CATLP[b])renderCatLP(b);
    setTabsActive('#cattabs',b);
  }
  function filterCat(f,btn){catState.f=f;renderCatGrid();}
  function priceInput(){
    const a=document.getElementById('pmin'),b=document.getElementById('pmax');
    let lo=parseFloat(a.value),hi=parseFloat(b.value);
    if(lo>hi){const t=lo;lo=hi;hi=t;}
    catState.pmin=lo;catState.pmax=hi;
    document.getElementById('range-fill').style.left=(lo/15*100)+'%';
    document.getElementById('range-fill').style.right=(100-hi/15*100)+'%';
    document.getElementById('pmin-lbl').textContent='R$ '+lo.toFixed(0);
    document.getElementById('pmax-lbl').textContent=(hi>=15?'R$ 15+':'R$ '+hi.toFixed(0));
    renderCatGrid();
  }
  function catSort(sel){catState.sort=sel.value;
    const sl=document.getElementById('cat-sortlabel');
    if(sl)sl.textContent='Ordenar por: '+sel.options[sel.selectedIndex].text;
    renderCatGrid();}
  function goCat(key){catState.f=key;catState.sort='rel';var sl=document.getElementById('cat-sortlabel');if(sl)sl.textContent='Ordenar por: Relevância';renderCatGrid();go('categoria');}

  /* ================= PRODUTO (PDP) ================= */
  let pdpBrand='agua',pdpId=null,pdpQty=1;
  function pdpDesc(p){
    const m={agua:'Água com gás e sabor natural de '+p.flavor.toLowerCase()+'. Zero calóricas, zero açúcar e aroma natural — refrescância na medida certa.',
      energetico:'Energético '+p.flavor.toLowerCase()+' para foco e disposição quando você mais precisa, com cafeína e taurina na dose certa.',
      sucos:'Suco de '+p.flavor.toLowerCase()+' feito com fruta de verdade: 100% suco, adoçado apenas com suco de maçã. Sem açúcar adicionado, sem conservantes nem corantes artificiais.'};
    return m[p.brand];
  }
  function pdpGalleryImages(p){
    const base=(p.gallery&&Array.isArray(p.gallery)?p.gallery:[p.img,p.imgHover]).filter(Boolean);
    const uniq=base.filter((u,i,a)=>a.indexOf(u)===i);
    return uniq.length?uniq:[p.img].filter(Boolean);
  }
  function setPdpMain(src,thumb){
    const pim=document.getElementById('pdp-img');
    const bottle=document.querySelector('.gallery .main .bottle');
    const label=document.getElementById('pdp-medialabel');
    if(src){
      pim.src=src;
      pim.style.display='block';
      if(bottle)bottle.style.display='none';
      if(label)label.style.display='none';
    }else{
      pim.removeAttribute('src');
      pim.style.display='none';
      if(bottle)bottle.style.display='';
      if(label)label.style.display='';
    }
    document.querySelectorAll('#pdp-thumbs .thumb').forEach(t=>t.classList.toggle('on',t===thumb));
  }
  function renderPdpGallery(p){
    const imgs=pdpGalleryImages(p);
    const thumbs=document.getElementById('pdp-thumbs');
    thumbs.innerHTML=imgs.map((src,i)=>`<button class="thumb${i===0?' on':''}" onclick="setPdpMain('${src}',this)" aria-label="Ver imagem ${i+1}"><img src="${src}" alt="${p.name} — imagem ${i+1}" loading="lazy"></button>`).join('');
    const first=thumbs.querySelector('.thumb');
    setPdpMain(imgs[0]||p.img,first);
  }
  function renderPdpDetails(p){
    const b=BRANDS[p.brand], cat=CATLP[p.brand], copy=PCOPY[p.id];
    const desc=[pdpDesc(p),copy?copy[1]:'',copy?copy[2]:''].filter(Boolean).join(' ');
    document.getElementById('pdp-tab-desc').innerHTML=`<p class="pdp-copy">${desc}</p><div class="info-list"><div><span>Marca</span><span>${b.name}</span></div><div><span>Sabor</span><span>${p.flavor}</span></div><div><span>Volume</span><span>${p.vol}</span></div><div><span>Validade</span><span>12 meses</span></div></div>`;
    document.getElementById('pdp-tab-nutrition').innerHTML=`<p class="pdp-copy">${cat.specsSub}</p><div class="info-list">${cat.specs.map(x=>`<div><span>${x[0]}</span><span>${x[1]}</span></div>`).join('')}</div>`;
    document.getElementById('pdp-tab-reviews').innerHTML=`<div class="pdp-review-grid">${cat.reviews.map(r=>`<article class="pdp-review">${star(5)}<p>“${r[2]}”</p><div class="who"><span class="av2">${avatarImg(r[0])}</span><span><b>${r[0]}</b><small>${r[1]}</small></span></div></article>`).join('')}</div>`;
    switchPdpTab('desc',document.querySelector('#pdp-tabhead [data-tab="desc"]'));
  }
  function switchPdpTab(tab,btn){
    document.querySelectorAll('#pdp-tabhead button').forEach(b=>b.classList.toggle('on',b===btn));
    document.querySelectorAll('.pdp-tabpanel').forEach(p=>p.classList.toggle('on',p.id==='pdp-tab-'+tab));
  }
  function openProduct(id,noNav){
    const p=byId(id);if(!p)return;
    pdpId=id;pdpBrand=p.brand;pdpQty=1;
    const b=BRANDS[p.brand];
    document.getElementById('pdp-cat').textContent=b.name;
    document.getElementById('pdp-crumb').textContent=p.name;
    document.getElementById('pdp-medialabel').textContent=(b.kicker+' '+p.flavor).toUpperCase();
    const pim=document.getElementById('pdp-img');pim.alt=p.name;
    renderPdpGallery(p);
    document.getElementById('pdp-kicker').textContent=b.kicker+' · '+b.tag;
    const pbl=document.getElementById('pdp-blogo');
    if(b.logo){pbl.src=b.logo;pbl.alt=b.name;pbl.style.display='block';}else{pbl.style.display='none';}
    document.getElementById('pdp-title').textContent=p.name+' — '+p.vol;
    document.getElementById('pdp-stars').innerHTML=starsInner(p.stars);
    document.getElementById('pdp-rev').textContent=p.rev+' avaliações';
    document.getElementById('pdp-price').textContent=p.semPreco?'Preço em breve':fmt(p.price);
    document.getElementById('pdp-old').textContent=p.old?fmt(p.old):'';
    // 2.6 — SKU sem preço: página existe, compra desabilitada
    const br=document.getElementById('pdp-buyrow'),bb=document.getElementById('pdp-buy'),sp=document.getElementById('pdp-sempreco');
    if(br)br.style.display=p.semPreco?'none':'';
    if(bb)bb.style.display=p.semPreco?'none':'';
    if(sp)sp.style.display=p.semPreco?'block':'none';
    // 2.7 — nota sobre os formatos de venda
    const fn=document.getElementById('pdp-formats-note');
    if(fn)fn.textContent=CONFIG.fardo.caixa12AplicaDuasVezes===null
      ? 'A caixa de 12 equivale a 2 fardos. A aplicação dupla da oferta (pagar 10 de 12) aguarda confirmação da diretoria.'
      : (CONFIG.fardo.caixa12AplicaDuasVezes?'Na caixa de 12 a oferta aplica duas vezes: você paga 10 unidades.':'Na caixa de 12 a oferta aplica uma vez.');
    document.getElementById('pdp-desc').textContent=pdpDesc(p);
    document.getElementById('pdp-qty').textContent='1';
    document.getElementById('pdp-variants').innerHTML=byBrand(p.brand).map(v=>`<span class="variant${v.id===id?' on':''}" onclick="openProduct('${v.id}')">${v.flavor}</span>`).join('');
    document.getElementById('pdp-sizes').innerHTML=(b.sizes||[p.vol]).map((sz,i)=>`<span class="variant${i===0?' on':''}" onclick="pickFormat(this)">${sz}</span>`).join('');
    renderPdpDetails(p);
    fill('grid-relacionados',byBrand(p.brand).filter(v=>v.id!==id).slice(0,4).map(v=>card(v)));
    if(!noNav)go('produto');
  }
  function pdpStep(d){pdpQty=Math.max(1,pdpQty+d);document.getElementById('pdp-qty').textContent=pdpQty;}
  function pickFormat(el){el.parentElement.querySelectorAll('.variant').forEach(v=>v.classList.remove('on'));el.classList.add('on');}
  function addPdp(){if(pdpId)addToCart(pdpId,pdpQty);}

  /* ==========================================================================
     MOTOR DE DESCONTOS  (itens 1.3, 1.4, 1.5, 1.6)
     --------------------------------------------------------------------------
     Duas famílias, que NUNCA se somam:
       família 1 — oferta de fardo (mecânica de produto, automática no carrinho)
       família 2 — cupom (teto de 10%, uso único por CPF) e Pix
     Regra: o carrinho recebe SEMPRE o melhor desconto aplicável, nunca a soma.
     ========================================================================== */
  function unidadesElegiveis(){
    const u=[];
    CART.forEach(l=>{const p=byId(l.id);if(p&&!p.semPreco)for(let i=0;i<l.qty;i++)u.push(p.price);});
    return u.sort((a,b)=>a-b);
  }
  /* família 1 — Leve 6, Pague 5: a cada 6 unidades, a mais barata sai grátis */
  function descontoFardo(){
    const u=unidadesElegiveis();
    const fardos=Math.floor(u.length/CONFIG.fardo.unidades);
    if(!fardos)return 0;
    let d=0;for(let i=0;i<fardos;i++)d+=u[i];
    return d;
  }
  function fardosNoCarrinho(){return Math.floor(unidadesElegiveis().length/CONFIG.fardo.unidades);}

  /* escolhe o melhor desconto entre as famílias — nunca soma */
  function melhorDesconto(sub,pagamento,cupomPct){
    const cand=[];
    const f=descontoFardo();
    if(f>0)cand.push({nome:'Oferta Leve '+CONFIG.fardo.unidades+', Pague '+CONFIG.fardo.pagas,valor:f,familia:'fardo'});
    if(cupomPct>0)cand.push({nome:'Cupom ('+Math.round(Math.min(cupomPct,CONFIG.cupom.tetoPct)*100)+'%)',
                             valor:sub*Math.min(cupomPct,CONFIG.cupom.tetoPct),familia:'cupom'});
    if(CONFIG.pix.ativo&&pagamento==='pix')cand.push({nome:'Desconto Pix ('+Math.round(CONFIG.pix.pct*100)+'%)',
                             valor:sub*CONFIG.pix.pct,familia:'pix'});
    if(!cand.length)return {nome:'',valor:0,familia:null,descartados:[]};
    cand.sort((a,b)=>b.valor-a.valor);
    const melhor=cand[0];
    melhor.descartados=cand.slice(1);
    return melhor;
  }
  /* 1.2 — frete grátis só na entrega normal, acima do valor configurado */
  function freteGratis(sub,modo){
    if(sub<CONFIG.frete.gratisAcimaDe)return false;
    if(CONFIG.frete.gratisSomenteNormal&&modo!=='normal')return false;
    return true;
  }
  function valorFrete(sub,modo){
    if(modo==='expressa')return CONFIG.frete.valorExpressa;  // sempre paga
    return freteGratis(sub,'normal')?0:CONFIG.frete.valorNormal;
  }

  /* ================= CARRINHO SHOPIFY ================= */
  let CART=[];
  const FREE=CONFIG.frete.gratisAcimaDe;
  const shopRoot=()=>((window.Shopify&&Shopify.routes&&Shopify.routes.root)||'/');

  async function shopifyJson(path,options){
    const r=await fetch(shopRoot()+path,options||{});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(data.description||data.message||'Erro no carrinho');
    return data;
  }
  async function syncCart(){
    try{
      const c=await shopifyJson('cart.js');
      CART=(c.items||[]).map(it=>{
        const p=CATALOG.find(x=>String(x.variantId)===String(it.variant_id));
        return p?{id:p.id,qty:it.quantity,key:it.key}:null;
      }).filter(Boolean);
      renderCart();
      return c;
    }catch(e){console.warn(e);renderCart();return null;}
  }
  async function buyNow(id,qty){
    qty=qty||1;
    const p=byId(id);if(!p)return;
    try{
      await shopifyJson('cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items:[{id:p.variantId,quantity:qty}]})});
      window.location.href=shopRoot()+'checkout';
    }catch(e){toast(e.message||'Não foi possível adicionar o produto');}
  }
  async function addToCart(id,qty=1){
    const p=byId(id);if(!p)return;
    try{
      await shopifyJson('cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items:[{id:p.variantId,quantity:qty}]})});
      await syncCart();
      const b=document.getElementById('cart-count');if(b){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop');}
      toast('Produto adicionado ao carrinho');openCart();
    }catch(e){toast(e.message||'Não foi possível adicionar o produto');}
  }
  async function cartStep(id,d){
    const l=CART.find(x=>x.id===id);if(!l)return;
    const q=Math.max(0,l.qty+d);
    try{await shopifyJson('cart/change.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({id:l.key,quantity:q})});await syncCart();}
    catch(e){toast(e.message||'Não foi possível atualizar o carrinho');}
  }
  async function cartRemove(id){
    const l=CART.find(x=>x.id===id);if(!l)return;
    try{await shopifyJson('cart/change.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({id:l.key,quantity:0})});await syncCart();}
    catch(e){toast(e.message||'Não foi possível remover o produto');}
  }
  function renderCart(){
    const wrap=document.getElementById('cart-items'); if(!wrap)return;
    const count=CART.reduce((s,l)=>s+l.qty,0);
    const badge=document.getElementById('cart-count');
    if(badge){badge.textContent=count;badge.style.display=count?'flex':'none';}
    const title=document.getElementById('cart-title');if(title)title.textContent='Seu carrinho ('+count+')';
    if(!CART.length){
      wrap.innerHTML='<div class="cart-empty"><span>Seu carrinho está vazio.</span><button class="btn" onclick="closeCart()">Explorar produtos</button></div>';
      const prog=document.getElementById('cart-progress');if(prog)prog.innerHTML='';
      const sub=document.getElementById('cart-subtotal');if(sub)sub.textContent=fmt(0);
      const tot=document.getElementById('cart-total');if(tot)tot.textContent=fmt(0);
      return;
    }
    let sub=0;
    wrap.innerHTML=CART.map(l=>{const p=byId(l.id);if(!p)return '';sub+=p.price*l.qty;return `<div class="citem">
      ${productThumb(p)}
      <div class="cinfo"><b>${p.name}</b><small>${p.flavor} · ${p.vol}</small><div class="cqty"><button onclick="cartStep('${p.id}',-1)">−</button><span>${l.qty}</span><button onclick="cartStep('${p.id}',1)">+</button></div></div>
      <div class="cprice"><b>${fmt(p.price*l.qty)}</b><button class="rm" onclick="cartRemove('${p.id}')">Remover</button></div>
    </div>`;}).join('');
    const prog=document.getElementById('cart-progress');
    if(prog){const falt=Math.max(0,FREE-sub);prog.innerHTML=falt>0?`Faltam <b>${fmt(falt)}</b> para frete grátis`:'<b>Você ganhou frete grátis na entrega normal.</b>';}
    const subtotal=document.getElementById('cart-subtotal');if(subtotal)subtotal.textContent=fmt(sub);
    const total=document.getElementById('cart-total');if(total)total.textContent=fmt(sub);
    const disc=document.getElementById('cart-disc');if(disc)disc.style.display='none';
  }
/* ================= FARDO (Leve 6, Pague 5) ================= */
  const KIT_MAX=CONFIG.fardo.unidades; // 6
  let kit=[]; // ids, máx KIT_MAX
  function renderKit(){
    const slots=document.getElementById('kb-slots');
    let freeIdx=-1;
    if(kit.length===KIT_MAX){let min=Infinity;kit.forEach((id,i)=>{const p=byId(id);if(p.price<min){min=p.price;freeIdx=i;}});}
    if(slots){
      let html='';
      for(let i=0;i<KIT_MAX;i++){
        if(kit[i]){const p=byId(kit[i]);const free=i===freeIdx;
          html+=`<div class="kb-slot filled${free?' free':''}" onclick="kitRemoveAt(${i})">
            ${free?'<span class="kb-freetag">Grátis</span>':''}
            ${p.img?`<img class="kb-img" src="${p.img}" alt="" loading="lazy" onerror="this.remove()">`:'<div class="kb-bottle"></div>'}
            <span class="kb-name">${p.name}</span>
            <span class="kb-price">${free?'R$ 0,00':fmt(p.price)}</span>
            <span class="kb-remove">Remover</span>
          </div>`;
        } else {
          html+=`<div class="kb-slot" onclick="openKit()"><span>Espaço ${i+1}</span><span style="font-size:11px;color:#666">Toque para escolher</span></div>`;
        }
      }
      slots.innerHTML=html;
    }
    const count=document.getElementById('kb-count');
    if(count)count.textContent='Selecionados: '+kit.length+' de '+KIT_MAX;
    const cta=document.getElementById('kb-cta');
    const ready=kit.length===KIT_MAX;
    if(cta){
      cta.style.opacity=ready?'1':'.4';
      cta.style.pointerEvents=ready?'auto':'none';
    }
  }
  function renderKitPicker(){
    const grid=document.getElementById('kitpick-grid');
    if(!grid)return;
    grid.innerHTML=CATALOG.filter(p=>!p.semPreco).map(p=>{
      const n=kit.filter(x=>x===p.id).length;
      const full=kit.length>=KIT_MAX;
      return `<button class="kitpick${n?' picked':''}${full&&!n?' off':''}" onclick="kitAdd('${p.id}')">
        <span class="kp-media">
          ${p.img?`<img src="${p.img}" alt="${p.name}" loading="lazy" onerror="this.remove()">`:'<span class="kp-bottle"></span>'}
          ${n?`<span class="kp-badge">${n}×</span>`:''}
        </span>
        <span class="kp-kicker">${BRANDS[p.brand].kicker}</span>
        <span class="kp-name">${p.name}</span>
        <span class="kp-foot"><span class="kp-price">${fmt(p.price)}</span><span class="kp-add">+</span></span>
      </button>`;
    }).join('');
    const sub=document.getElementById('kit-modal-sub');
    if(sub)sub.innerHTML=kit.length<KIT_MAX
      ? `Selecionados <b>${kit.length}</b> de ${KIT_MAX} · o mais barato sai grátis`
      : `Fardo completo! O item mais barato saiu grátis`;
  }
  function openKit(){
    renderKitPicker();
    document.getElementById('kitModal').classList.add('on');
    document.body.style.overflow='hidden';
  }
  function closeKit(){document.getElementById('kitModal').classList.remove('on');document.body.style.overflow='';}
  function renderRulesDiagram(){
    const el=document.getElementById('rules-diagram');
    if(!el)return;
    const base=['p1','p13','p7','p14','p2','p16'].slice(0,CONFIG.fardo.unidades);
    const pick=base.map(id=>byId(id)).filter(Boolean);
    let h='';
    pick.forEach((p,i)=>{
      const free=i===pick.length-1;
      if(i)h+=`<span class="rd-op">${free?'=':'+'}</span>`;
      h+=`<div class="rd-item${free?' free':''}">
        <div class="rd-box">
          ${p.img?`<img src="${p.img}" alt="" loading="lazy" onerror="this.remove()">`:'<span class="rd-bottle"></span>'}
          ${free?'<span class="rd-freetag">Grátis</span>':''}
        </div>
        <b>${free?CONFIG.fardo.unidades+'º item':'Item '+(i+1)}</b><small>${free?'por nossa conta':'você paga'}</small>
      </div>`;
    });
    el.innerHTML=h;
  }
  function openRules(){renderRulesDiagram();document.getElementById('rulesModal').classList.add('on');document.body.style.overflow='hidden';}
  function closeRules(){document.getElementById('rulesModal').classList.remove('on');document.body.style.overflow='';}
  function kitAdd(id){
    if(kit.length>=KIT_MAX){toast('Seu fardo já tem '+KIT_MAX+' itens');return;}
    kit.push(id);renderKit();renderKitPicker();
    if(kit.length>=KIT_MAX){setTimeout(()=>{closeKit();toast('Fardo completo! O item mais barato saiu grátis');},420);}
  }
  function kitRemoveAt(i){kit.splice(i,1);renderKit();renderKitPicker();}
  async function addKitToCart(){
    if(kit.length!==KIT_MAX)return;
    const items=kit.map(id=>byId(id)).filter(Boolean).map(p=>({id:p.variantId,quantity:1}));
    if(items.length!==KIT_MAX)return;
    try{
      await shopifyJson('cart/add.js',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({items})});
      const min=Math.min(...kit.map(id=>byId(id).price));
      await syncCart();
      toast('Fardo adicionado! A promoção será aplicada conforme as regras da loja.');
      kit=[];renderKit();openCart();
    }catch(e){toast(e.message||'Não foi possível adicionar o fardo');}
  }

  /* ==========================================================================
     1.8 — CONTADOR DA OFERTA COM DATA-FIM REAL
     Não reseta a cada sessão. Ou usa CONFIG.oferta.dataFim (data fixa no admin),
     ou roda em ciclo semanal real, reiniciando toda segunda-feira 00:00.
     ========================================================================== */
  function fimDaOferta(){
    if(CONFIG.oferta.dataFim)return new Date(CONFIG.oferta.dataFim);
    const agora=new Date(), alvo=CONFIG.oferta.cicloSemanalReiniciaEm;
    const d=new Date(agora);
    let dias=(alvo-agora.getDay()+7)%7;
    if(dias===0)dias=7;
    d.setDate(agora.getDate()+dias);d.setHours(0,0,0,0);
    return d;
  }
  (function contadorOferta(){
    const el=id=>document.getElementById(id);
    if(!el('cd-d'))return;
    const nf=n=>String(Math.max(0,n)).padStart(2,'0');
    function tick(){
      const fim=fimDaOferta();
      let dif=Math.max(0,Math.floor((fim-new Date())/1000));
      el('cd-d').textContent=nf(Math.floor(dif/86400));dif%=86400;
      el('cd-h').textContent=nf(Math.floor(dif/3600));dif%=3600;
      el('cd-m').textContent=nf(Math.floor(dif/60));
      el('cd-s').textContent=nf(dif%60);
      const f=el('cd-fim');
      if(f)f.textContent='Esta oferta encerra em '+fim.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})+
        (CONFIG.oferta.dataFim?'':' · a campanha reinicia toda segunda-feira');
    }
    tick();setInterval(tick,1000);
  })();

  /* ================= PROVA SOCIAL (avatares) ================= */
  (function(){
    const wrap=document.getElementById('social');
    const names=['Marina Alves','Rafael Costa','Juliana Prado','Diego Ramos','Camila Souza','Bruno Martins','Anderson Lima','Priscila Nunes','Marcos Teixeira','Ana Ribeiro','Carlos Dias','Fernanda Lopes','Rogerio Melo','Marina A.','Rafael C.','Juliana P.'];
    const N=16;
    for(let i=0;i<N;i++){
      const ang=(i/N)*Math.PI*2;const rx=40+(i%2?4:0),ry=34+(i%2?3:0);
      const x=50+Math.cos(ang)*rx,y=50+Math.sin(ang)*ry;
      const a=document.createElement('div');
      const name=names[i%names.length];
      a.className='av has-photo'+(i%4===0?' hide-m':'');
      a.style.left=x+'%';a.style.top=y+'%';
      a.style.width=(i%3===0?66:i%3===1?52:44)+'px';a.style.height=a.style.width;
      a.style.transform='translate(-50%,-50%)';
      a.innerHTML=avatarImg(name,undefined,'av-social');
      wrap.appendChild(a);
    }
  })();

  /* ================= DEPOIMENTOS ================= */
  const testimonials=[
    {n:'Marina Alves',f:1,c:'São Paulo, SP',t:'A Vittari virou minha água oficial do escritório. Refrescante e sem açúcar, exatamente o que eu procurava.'},
    {n:'Rafael Costa',f:0,c:'Belo Horizonte, MG',t:'O +Power Energy Zero me salva nos plantões. Chegou rápido e o combo saiu num precinho ótimo.'},
    {n:'Juliana Prado',f:1,c:'Curitiba, PR',t:'Sucos NH+ com gosto de fruta de verdade. Meus filhos adoram e eu fico tranquila com os ingredientes.'},
    {n:'Diego Ramos',f:0,c:'Recife, PE',t:'Comprar as três marcas num carrinho só é genial. Frete grátis fechou o pedido pra mim.'},
    {n:'Camila Souza',f:1,c:'Porto Alegre, RS',t:'Atendimento nota 10 e entrega antes do prazo. Já virei cliente recorrente das três linhas.'},
    {n:'Bruno Martins',f:0,c:'Salvador, BA',t:'As margens de revenda são justas e o material de apoio ajudou demais nas minhas vendas.'}
  ];
  document.getElementById('quotes').innerHTML=testimonials.map(q=>`
    <div class="quote">${star(5)}<p>"${q.t}"</p>
      <div class="who"><span class="av2">${avatarImg(q.n,q.f)}</span><span><b>${q.n}</b><small>${q.c}</small></span></div>
    </div>`).join('');

  /* ================= NAVEGAÇÃO ================= */
  let veil=null, navBusy=false;
  function showPage(el,page){
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('on','leaving'));
    el.classList.add('on');
    document.querySelectorAll('.menu a[data-nav]').forEach(a=>a.classList.toggle('active',a.dataset.nav===page));
    window.scrollTo({top:0});
    if(veil)veil.classList.remove('on');
    if(window.revealVisible)requestAnimationFrame(()=>setTimeout(window.revealVisible,20));
    navBusy=false;
  }
  function go(page){
    const el=document.getElementById('page-'+page);
    if(!el||navBusy)return;
    closeAll();
    const cur=document.querySelector('.page.on');
    if(!veil){veil=document.createElement('div');veil.className='page-veil';document.body.appendChild(veil);}
    if(!cur||cur===el){showPage(el,page);return;}
    if(window.matchMedia('(max-width: 768px)').matches){
      showPage(el,page);
      return;
    }
    navBusy=true;
    cur.classList.add('leaving');
    veil.classList.add('on');
    setTimeout(()=>showPage(el,page),260);
  }
  function openCart(){document.getElementById('cart').classList.add('on');document.getElementById('overlay').classList.add('on');document.body.style.overflow='hidden';}
  function closeCart(){document.getElementById('cart').classList.remove('on');document.getElementById('overlay').classList.remove('on');document.body.style.overflow='';}
  function openSearch(){document.getElementById('searchPanel').classList.add('on');document.getElementById('overlay').classList.add('on');setTimeout(()=>document.getElementById('searchInput').focus(),200);}
  function closeSearch(){document.getElementById('searchPanel').classList.remove('on');document.getElementById('overlay').classList.remove('on');}
  function openMobile(){document.getElementById('mobileMenu').classList.add('on');document.body.style.overflow='hidden';}
  function closeMobile(){document.getElementById('mobileMenu').classList.remove('on');document.body.style.overflow='';}
  function closeAll(){closeCart();closeSearch();}
  function scrollGrid(){const e=document.getElementById('oferta-grid');if(e)e.scrollIntoView({behavior:'smooth'});}
  function scrollForm(){const e=document.getElementById('reseller-form');if(e)e.scrollIntoView({behavior:'smooth'});}
  function scrollCats(){go('home');setTimeout(()=>{const el=document.getElementById('cat-section');if(el)el.scrollIntoView({behavior:'smooth'});},60);}
  let toastT;
  function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);}
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeAll();closeMobile();closeKit();closeRules();closePopup();closeThanks();}});

  /* ================= WIRING ================= */
  // sidebar categoria (marca navega, resto alterna)
  (function(){
    const opts=document.querySelectorAll('#page-categoria .fgroup:first-child .fopt');
    const keys=['agua','energetico','sucos'];
    opts.forEach((o,i)=>o.onclick=()=>{catState.f=keys[i];renderCatGrid();});
    document.querySelectorAll('#page-categoria .fgroup:not(:first-child) .fopt').forEach(o=>o.onclick=()=>o.querySelector('.fbox').classList.toggle('on'));
  })();
  // busca
  (function(){
    const input=document.getElementById('searchInput');
    if(input)input.addEventListener('input',e=>renderSearch(e.target.value));
    document.querySelectorAll('#searchPanel .sugg .chip').forEach(c=>c.onclick=()=>{input.value=c.textContent;renderSearch(c.textContent);input.focus();});
  })();
  // faq + tabs genéricas (as abas da PDP usam switchPdpTab)
  document.querySelectorAll('.tabhead:not(#pdp-tabhead)').forEach(h=>h.querySelectorAll('b').forEach(b=>b.onclick=()=>{h.querySelectorAll('b').forEach(x=>x.classList.remove('on'));b.classList.add('on');}));

  /* ================= CHECKOUT ================= */
  /* ============================================================
     ENVIO DO PEDIDO (GET)  —  cole a URL do seu Apps Script aqui
     ============================================================ */
  const ORDER_ENDPOINT=''; // ex.: 'https://script.google.com/macros/s/AKfy.../exec'

  function orderPayload(id){
    const v=i=>{const e=document.getElementById(i);return e?e.value.trim():'';};
    const itens=CART.map(l=>{const p=byId(l.id);return `${l.qty}x ${p.name} (${p.vol})`;}).join(' | ')
      + (coBump?' | 1x +Power Energy Zero Açúcar (oferta)':'');
    const sub=coSubtotal();
    const shipCost=valorFrete(sub,coShipMode);
    const melhor=melhorDesconto(sub,coPay,coCoupon);
    const disc=melhor.valor;
    return {
      pedido:id, data:new Date().toLocaleString('pt-BR'),
      nome:v('f-nome'), email:v('f-email'), cpf:v('f-cpf'), fone:v('f-fone'),
      cep:v('f-cep'), endereco:v('f-end'), numero:v('f-num'),
      bairro:v('f-bairro'), cidade:v('f-cidade'),
      itens:itens, qtd:CART.reduce((t,l)=>t+l.qty,0)+(coBump?1:0),
      // lista estruturada para o Mercado Pago montar o checkout
      mp:JSON.stringify(CART.map(l=>{const p=byId(l.id);
            return {t:p.name+' '+p.vol,q:l.qty,v:+p.price.toFixed(2)};})
          .concat(coBump?[{t:'+Power Energy Zero Açúcar 269ml (oferta)',q:1,v:BUMP_PRICE}]:[])),
      cupom:coCoupon?document.getElementById('co-coupon-input').value.trim().toUpperCase():'',
      desconto_aplicado:melhor.nome||'',
      subtotal:sub.toFixed(2), desconto:disc.toFixed(2),
      frete:shipCost.toFixed(2), total:Math.max(0,sub-disc+shipCost).toFixed(2),
      pagamento:coPay, envio:(coShipMode==='expressa'?'Expressa':'Normal')+(shipCost===0?' (grátis)':'')
    };
  }

  /* GET via JSONP: registra o pedido e recebe de volta o link de pagamento.
     JSONP porque o Apps Script não libera CORS para fetch. */
  function sendOrder(id,cb){
    if(!ORDER_ENDPOINT){if(cb)cb(null);return;}
    const d=orderPayload(id);
    const fn='nhcb_'+Date.now();
    let done=false;
    const finish=url=>{if(done)return;done=true;
      try{delete window[fn];}catch(e){}
      if(sc.parentNode)sc.parentNode.removeChild(sc);
      if(cb)cb(url);};
    window[fn]=r=>finish(r&&r.pagamento?r.pagamento:null);
    const qs=Object.keys(d).map(k=>encodeURIComponent(k)+'='+encodeURIComponent(d[k])).join('&');
    const sc=document.createElement('script');
    sc.src=ORDER_ENDPOINT+'?callback='+fn+'&'+qs;
    sc.onerror=()=>finish(null);
    document.body.appendChild(sc);
    setTimeout(()=>finish(null),12000); // se o Google demorar, segue sem travar
  }

  let coStep=1, coBump=false, coShipMode='normal', coPay='pix', coCoupon=0, coTimerInt=null, popupShown=false;
  const BUMP_ID=CONFIG.bump.id, BUMP_PRICE=CONFIG.bump.preco; // 1.7 — R$ 5,90, só acima de R$ 80
  function goCheckout(){
    if(!CART.length){toast('Seu carrinho está vazio');return;}
    closeCart();
    window.location.href=shopRoot()+'checkout';
  }
  function coCrossCard(p){
    return `<div class="card"><div class="card-media"><div class="bottle"></div><span class="media-label">${(BRANDS[p.brand].kicker+' '+p.flavor).toUpperCase()}</span>${productImgTag(p,'pimg',p.name)}</div>
      <div class="card-body"><span class="kicker">${BRANDS[p.brand].kicker}</span><span class="name">${p.name}</span>
      <div class="price-row"><span class="now">${fmt(p.price)}</span></div>
      <button class="add" onclick="addToCart('${p.id}',1);renderCheckout()">Adicionar</button></div></div>`;
  }
  function checkoutStep(n){
    coStep=n;
    document.querySelectorAll('#page-checkout .co-panel').forEach(p=>p.classList.toggle('on',+p.dataset.step===n));
    document.querySelectorAll('#co-steps .co-stp').forEach(s=>{const v=+s.dataset.s;s.classList.toggle('on',v===n);s.classList.toggle('done',v<n);});
    window.scrollTo({top:0});
    if(n===4&&coTimerInt){clearInterval(coTimerInt);}
  }
  function coItemsList(){return CART.map(l=>({p:byId(l.id),qty:l.qty})).concat(coBump?[{p:{id:BUMP_ID,name:'+Power Energy Zero Açúcar',flavor:'Zero Açúcar',vol:'269ml',price:BUMP_PRICE,bump:true},qty:1}]:[]);}
  function coSubtotal(){let s=0;CART.forEach(l=>s+=byId(l.id).price*l.qty);if(coBump)s+=BUMP_PRICE;return s;}
  function renderCheckout(){
    // itens editáveis (step 1)
    document.getElementById('co-items').innerHTML=CART.map(l=>{const p=byId(l.id);return `<div class="co-citem">
      ${productThumb(p)}
      <div><b>${p.name}</b><small>${p.flavor} · ${p.vol}</small>
        <div class="miniqty"><button onclick="cartStep('${l.id}',-1);renderCheckout()">−</button><span>${l.qty}</span><button onclick="cartStep('${l.id}',1);renderCheckout()">+</button></div>
      </div>
      <div style="text-align:right"><b>${fmt(p.price*l.qty)}</b><br><a class="rm" style="font-size:11px" onclick="cartRemove('${l.id}');renderCheckout()">Remover</a></div>
    </div>`;}).join('') || '<p class="muted" style="padding:16px 0">Sua sacola está vazia.</p>';
    // 1.7 — o bump só aparece em carrinhos acima do valor configurado
    const subSemBump=coSubtotal()-(coBump?BUMP_PRICE:0);
    const bumpLiberado=subSemBump>=CONFIG.bump.liberaAcimaDe;
    const bumpBox=document.getElementById('co-bump');
    if(bumpBox){
      if(!bumpLiberado&&coBump){coBump=false;document.getElementById('co-bump-check').classList.remove('on');}
      bumpBox.style.display=bumpLiberado?'':'none';
    }
    // resumo
    const sub=coSubtotal();
    const shipFree=freteGratis(sub,coShipMode);          // 1.2 — só na entrega normal
    const shipCost=valorFrete(sub,coShipMode);
    const melhor=melhorDesconto(sub,coPay,coCoupon);      // 1.3/1.4/1.5/1.6 — nunca soma
    const disc=melhor.valor;
    const total=Math.max(0,sub-disc+shipCost);
    const sumItems=coItemsList();
    const bump=byId(BUMP_ID);const bumpEl=document.getElementById('co-bump-img');if(bumpEl)bumpEl.innerHTML=productImgTag(bump,'','+Power Energy Zero Açúcar');
    // rótulos das modalidades de frete
    const vn=document.getElementById('co-val-normal'),ve=document.getElementById('co-val-exp');
    if(vn)vn.textContent=freteGratis(sub,'normal')?'Grátis':fmt(CONFIG.frete.valorNormal);
    if(ve)ve.textContent=fmt(CONFIG.frete.valorExpressa);
    const pn=document.getElementById('co-prazo-normal'),pe=document.getElementById('co-prazo-exp');
    if(pn)pn.textContent=CONFIG.frete.prazoNormal;
    if(pe)pe.textContent=CONFIG.frete.prazoExpressa;
    document.getElementById('co-sum-items').innerHTML=sumItems.map(it=>{
      const full=byId(it.p.id)||it.p;
      return `<div class="co-sum-item">
        <span class="cs-thumb">${productImgTag(full,'',full.name)}<i>${it.qty}</i></span>
        <span class="cs-txt"><b>${it.p.name}${it.p.bump?' <em>(oferta)</em>':''}</b><small>${it.p.flavor} · ${it.p.vol}</small></span>
        <span class="cs-val">${fmt(it.p.price*it.qty)}</span>
      </div>`;}).join('');
    const LIM=CONFIG.frete.gratisAcimaDe;
    const fb=document.getElementById('co-freebar');
    if(sub>=LIM)fb.innerHTML='✓ Você tem <b>frete grátis</b> na entrega normal<div class="bar"><i style="width:100%"></i></div>';
    else fb.innerHTML='Faltam <b>'+fmt(LIM-sub)+'</b> para o frete grátis (entrega normal)<div class="bar"><i style="width:'+Math.round(sub/LIM*100)+'%"></i></div>';
    let rows='<div class="r"><span>Subtotal</span><span>'+fmt(sub)+'</span></div>';
    if(disc>0){
      rows+='<div class="r"><span>'+melhor.nome+'</span><span class="disc">− '+fmt(disc)+'</span></div>';
      if(melhor.descartados&&melhor.descartados.length)
        rows+='<div class="r"><span class="muted" style="font-size:11px">Descontos não são cumulativos: aplicamos o melhor para você</span><span></span></div>';
    }
    rows+='<div class="r"><span>Frete '+(coShipMode==='expressa'?'expresso':'normal')+'</span><span>'+(shipCost===0?'Grátis':fmt(shipCost))+'</span></div>';
    rows+='<div class="r tot"><span>Total</span><span>'+fmt(total)+'</span></div>';
    document.getElementById('co-sum-rows').innerHTML=rows;
    // 1.9 — parcelamento padronizado
    const par=parcelas(total), pe2=document.getElementById('co-parcela');
    if(pe2)pe2.textContent=par?(par.n+'x de '+fmt(par.v)+' sem juros'):'Pagamento à vista';
    const sel=document.getElementById('co-parcela-sel');
    if(sel){
      let o='<option>1x à vista — '+fmt(total)+'</option>';
      for(let i=2;i<=CONFIG.parcelamento.maxParcelas;i++){
        if(total/i<CONFIG.parcelamento.parcelaMinima)break;
        o+='<option'+(par&&i===par.n?' selected':'')+'>'+i+'x de '+fmt(total/i)+' sem juros</option>';
      }
      sel.innerHTML=o;
    }
    // 1.6 — Pix entra desligado: sem selo e sem promessa de desconto
    const pixBadge=document.getElementById('co-pix-badge');
    if(pixBadge)pixBadge.style.display=CONFIG.pix.ativo?'':'none';
    const pixTitle=document.getElementById('co-pix-title');
    if(pixTitle)pixTitle.textContent=CONFIG.pix.ativo?('Pague com Pix e ganhe '+Math.round(CONFIG.pix.pct*100)+'% OFF'):'Pague com Pix';
  }
  function toggleBumpEl(){if(document.getElementById('co-bump').style.display==='none')return;coBump=!coBump;document.getElementById('co-bump-check').classList.toggle('on',coBump);renderCheckout();toast(coBump?'Oferta adicionada!':'Oferta removida');}
  function pickShip(el,modo){document.querySelectorAll('.co-ship-opt').forEach(o=>o.classList.remove('on'));el.classList.add('on');coShipMode=modo;renderCheckout();}
  function pickPay(el,method){document.querySelectorAll('.co-pay').forEach(o=>o.classList.remove('on'));el.classList.add('on');coPay=method;
    document.getElementById('co-card-form').style.display=method==='cartao'?'block':'none';
    document.getElementById('co-pix-box').style.display=method==='pix'?'flex':'none';
    renderCheckout();}
  /* 1.4 — família cupom: teto de 10%, uso único por CPF, com validade.
     PRIMEIRA10 = primeira compra · VOLTA10 = recuperação de carrinho */
  const CUPONS={PRIMEIRA10:0.10, VOLTA10:0.10};
  function applyCoupon(){const v=document.getElementById('co-coupon-input').value.trim().toUpperCase();
    if(CUPONS[v]!==undefined){
      coCoupon=Math.min(CUPONS[v],CONFIG.cupom.tetoPct);
      toast('Cupom aplicado: '+Math.round(coCoupon*100)+'% OFF (não acumula com a oferta de fardo)');
    }
    else{coCoupon=0;toast('Cupom inválido');}renderCheckout();}
  function summaryNext(){if(coStep<3)checkoutStep(coStep+1);else window.location.href=shopRoot()+'checkout';}
  function placeOrder(){
    const id='NH-'+Math.floor(100000+Math.random()*900000);
    const btn=event&&event.target?event.target:null;
    if(btn){btn.disabled=true;btn.textContent='Gerando pagamento…';}
    sendOrder(id,function(payUrl){
      if(payUrl){ window.location.href=payUrl; return; }   // vai para o Mercado Pago
      // sem gateway configurado: confirma direto (modo wireframe)
      if(btn){btn.disabled=false;btn.textContent='Finalizar pedido';}
      document.getElementById('co-order-id').textContent='#'+id;
      CART=[];renderCart();checkoutStep(4);toast('Pedido confirmado!');
    });
  }
  function closeCheckoutToStore(){go('home');}
  function startCoTimer(){let t=600;clearInterval(coTimerInt);const el=document.getElementById('co-timer');coTimerInt=setInterval(()=>{t--;if(t<0){clearInterval(coTimerInt);return;}const m=String(Math.floor(t/60)).padStart(2,'0'),s=String(t%60).padStart(2,'0');el.textContent=m+':'+s;},1000);}
  function openPopup(){popupShown=true;document.getElementById('coPopup').classList.add('on');}
  function closePopup(){document.getElementById('coPopup').classList.remove('on');}
  function usePopupCoupon(){coCoupon=Math.min(0.10,CONFIG.cupom.tetoPct);document.getElementById('co-coupon-input').value='PRIMEIRA10';renderCheckout();closePopup();toast('Cupom PRIMEIRA10 aplicado: 10% OFF');}
  // liga o order bump (clique no bloco todo)
  document.getElementById('co-bump').addEventListener('click',toggleBumpEl);

  /* ================= MINHA CONTA ================= */
  let accLogged=false;
  const ORDERS=[
    {id:'#NH-284197',date:'12/07/2026',status:'A caminho',ok:false,step:2,track:'NH284197901BR',items:[['p1',2],['p7',1],['p14',1]]},
    {id:'#NH-285640',date:'14/07/2026',status:'Em separação',ok:false,step:1,track:null,items:[['p11',2],['p16',1]]},
    {id:'#NH-273905',date:'28/06/2026',status:'Entregue',ok:true,step:3,track:'NH273905882BR',items:[['p7',3],['p13',2]]},
    {id:'#NH-259142',date:'10/06/2026',status:'Entregue',ok:true,step:3,track:'NH259142773BR',items:[['p11',4],['p16',1]]}
  ];
  function orderTotal(o){return o.items.reduce((s,[id,q])=>s+byId(id).price*q,0);}
  function openAccount(){go('conta');showAccState();}
  function showAccState(){
    document.getElementById('acc-auth').style.display=accLogged?'none':'block';
    document.getElementById('acc-dash').style.display=accLogged?'block':'none';
    if(accLogged){renderAccount();}
  }
  function accLogin(){accLogged=true;showAccState();accNav('overview',document.querySelector('#acc-dash .acc-navi'));toast('Bem-vindo de volta!');}
  function accLogout(){accLogged=false;showAccState();toast('Você saiu da conta');}
  function accNav(pane,btn){
    document.querySelectorAll('#acc-dash .acc-navi').forEach(b=>b.classList.remove('on'));
    if(btn)btn.classList.add('on');
    document.querySelectorAll('#acc-dash .acc-pane').forEach(p=>p.classList.toggle('on',p.dataset.pane===pane));
    window.scrollTo({top:0});
  }
  function trackBox(o){
    return o.track
      ? `<div class="acc-trackbox"><small>Código de rastreio</small><b>${o.track}</b></div>`
      : `<div class="acc-trackbox waiting"><small>Código de rastreio</small><b>Aguardando gerar código</b></div>`;
  }
  function orderRow(o){return `<div class="acc-order">
    <div class="oinfo"><b>${o.id}</b><small>${o.date} · ${o.items.length} itens · ${fmt(orderTotal(o))}</small></div>
    ${trackBox(o)}
    <div class="oactions">
      <span class="acc-status${o.ok?' ok':''}">${o.status}</span>
      <button class="btn ghost sm" onclick="accShowOrder('${o.id}')">Ver detalhes</button>
    </div></div>`;}
  function renderAccount(){
    document.getElementById('acc-o-count').textContent=ORDERS.length;
    document.getElementById('acc-last').innerHTML=orderRow(ORDERS[0]);
    document.getElementById('acc-orders').innerHTML=ORDERS.map(orderRow).join('');
  }
  function accShowOrder(id){
    const o=ORDERS.find(x=>x.id===id);if(!o)return;
    document.getElementById('acc-od-id').textContent='Pedido '+o.id;
    const st=document.getElementById('acc-od-status');st.textContent=o.status;st.className='acc-status'+(o.ok?' ok':'');
    const steps=['Confirmado','Em separação','Enviado','Entregue'];
    document.getElementById('acc-od-track').innerHTML=steps.map((s,i)=>`<div class="tstep${i<=o.step?' done':''}"><div class="tdot"></div>${s}</div>`).join('');
    document.getElementById('acc-od-items').innerHTML=o.items.map(([pid,q])=>{const p=byId(pid);return `<div class="acc-order"><div class="oinfo"><b>${p.name}</b><small>${p.flavor} · ${p.vol} · Qtd ${q}</small></div><b>${fmt(p.price*q)}</b></div>`;}).join('');
    document.getElementById('acc-od-total').innerHTML='<span>Total</span><span>'+fmt(orderTotal(o))+'</span>';
    document.querySelectorAll('#acc-dash .acc-pane').forEach(p=>p.classList.toggle('on',p.dataset.pane==='pedido'));
    document.querySelectorAll('#acc-dash .acc-navi').forEach(b=>b.classList.remove('on'));
    document.querySelector('#acc-dash .acc-navi:nth-child(2)').classList.add('on');
    window.scrollTo({top:0});
  }


  /* ================= CONTADOR DA PROVA SOCIAL ================= */
  (function(){
    const el=document.getElementById('social-count');
    const sec=document.querySelector('.social');
    if(!el||!sec)return;
    const TARGET=50000, DUR=1800;
    const nf=new Intl.NumberFormat('pt-BR');
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let done=false;
    function run(){
      if(done)return; done=true;
      if(reduce){el.textContent=nf.format(TARGET);return;}
      const t0=performance.now();
      const ease=t=>1-Math.pow(1-t,3); // easeOutCubic
      (function tick(now){
        const p=Math.min(1,(now-t0)/DUR);
        el.textContent=nf.format(Math.round(TARGET*ease(p)));
        if(p<1)requestAnimationFrame(tick);
      })(t0);
    }
    if('IntersectionObserver'in window){
      const io=new IntersectionObserver(es=>{
        es.forEach(e=>{if(e.isIntersecting){run();io.disconnect();}});
      },{threshold:.4});
      io.observe(sec);
    } else { run(); }
  })();


  /* ================= ANIMAÇÕES DE ENTRADA ================= */
  (function(){
    const SEL=['.sec-head','.grid','.prow','.catblocks','.benefits','.promise-row','.about','.news',
               '.quotes','.steps','.rbenefits','.kits','.margin-strip','.statbar-row','.lp-hero',
               '.faq','.form','.promo-hero','.kitband-in','.co-steps','.acc-layout','.social-chips'];
    const els=[];
    document.querySelectorAll(SEL.join(',')).forEach(el=>{
      if(el.closest('.hero'))return;
      el.classList.add('reveal');els.push(el);
    });
    if(!('IntersectionObserver'in window)){els.forEach(e=>e.classList.add('in'));return;}
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
    },{threshold:.12,rootMargin:'0px 0px -40px 0px'});
    els.forEach(e=>io.observe(e));
    // registra conteúdo criado dinamicamente (LPs)
    window.registerReveal=function(root){
      (root||document).querySelectorAll('.reveal:not(.in)').forEach(el=>io.observe(el));
    };
    // revela o que já está visível ao trocar de página
    window.revealVisible=function(){
      document.querySelectorAll('.page.on .reveal:not(.in)').forEach(el=>{
        const r=el.getBoundingClientRect();
        if(r.top<window.innerHeight*0.95)el.classList.add('in');
      });
    };
  })();

  /* sombra no header ao rolar */
  (function(){
    const h=document.querySelector('header.site');
    if(!h)return;
    const on=()=>h.classList.toggle('scrolled',window.scrollY>8);
    window.addEventListener('scroll',on,{passive:true});on();
  })();


  /* ================= FAQ (acordeão) ================= */
  function toggleFaq(btn){
    const item=btn.closest('.faq-item');
    if(!item)return;
    const open=item.classList.contains('open');
    item.parentElement.querySelectorAll('.faq-item.open').forEach(i=>i.classList.remove('open'));
    if(!open)item.classList.add('open');
  }

  /* ================= CONTADORES [data-count] ================= */
  (function(){
    const els=document.querySelectorAll('[data-count]');
    if(!els.length)return;
    const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nf=n=>new Intl.NumberFormat('pt-BR').format(n);
    function run(el){
      if(el.dataset.done)return; el.dataset.done='1';
      const target=parseFloat(el.dataset.count);
      const dec=parseInt(el.dataset.dec||'0',10);
      const pre=el.dataset.prefix||'', suf=el.dataset.suffix||'';
      const out=v=>el.textContent=pre+(dec?v.toFixed(dec).replace('.',','):nf(Math.round(v)))+suf;
      if(reduce){out(target);return;}
      const DUR=1500,t0=performance.now(),ease=t=>1-Math.pow(1-t,3);
      (function tick(now){
        const p=Math.min(1,(now-t0)/DUR);
        out(target*ease(p));
        if(p<1)requestAnimationFrame(tick);
      })(t0);
    }
    if(!('IntersectionObserver'in window)){els.forEach(run);return;}
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{if(e.isIntersecting){run(e.target);io.unobserve(e.target);}});
    },{threshold:.6});
    els.forEach(e=>io.observe(e));
    window.scanCounters=function(root){
      (root||document).querySelectorAll('[data-count]').forEach(e=>{if(!e.dataset.done)io.observe(e);});
    };
  })();

  /* ================= GRÁFICO DA LP + BARRAS DE MARGEM ================= */
  (function(){
    function fillBars(root){
      root.querySelectorAll('.cbar').forEach((b,i)=>{
        const bar=b.querySelector('i');
        setTimeout(()=>{bar.style.height=(b.dataset.h||0)+'%';},80*i);
        const v=b.querySelector('.cval');
        if(v)setTimeout(()=>{v.style.bottom='calc('+(b.dataset.h||0)+'% + 6px)';},80*i);
      });
      root.querySelectorAll('.mrow .mbar i').forEach((bar,i)=>{
        if(!bar.dataset.w)return;
        setTimeout(()=>{bar.style.width=bar.dataset.w+'%';},120*i);
      });
    }
    const targets=document.querySelectorAll('.lp-chart,.margin-strip');
    if(!targets.length)return;
    if(!('IntersectionObserver'in window)){targets.forEach(fillBars);return;}
    const io=new IntersectionObserver(es=>{
      es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');fillBars(e.target);io.unobserve(e.target);}});
    },{threshold:.25});
    targets.forEach(t=>io.observe(t));
  })();


  /* avatares estáticos (depoimentos do revendedor + pilha do hero) */
  (function(){
    document.querySelectorAll('[data-av]').forEach(el=>{
      el.innerHTML=avatarImg(el.dataset.av,el.dataset.fem==='1');
    });
    const st=document.getElementById('lp-avstack');
    if(st)st.innerHTML=['Ana Ribeiro','Carlos Dias','Fernanda Lopes','Rogerio Melo']
      .map((n,i)=>`<i>${avatarImg(n,i%2===0)}</i>`).join('');
  })();

  /* popup de obrigado (cadastro do revendedor) */
  function openThanks(){
    document.getElementById('thanksModal').classList.add('on');
    document.body.style.overflow='hidden';
  }
  function closeThanks(){
    document.getElementById('thanksModal').classList.remove('on');
    document.body.style.overflow='';
  }

  /* ================= INIT ================= */
  renderGeral('todos');
  renderVend('todos');
  renderRankGrid();
  renderOferta('todos');
  renderSearch('');
  renderCatGrid();
  if(document.getElementById('pmin'))priceInput();
  renderCart();
  syncCart();
  renderKit();
  openProduct('p1',true); // pré-carrega dados da PDP, sem navegar
  go('home');

  /* sempre abrir no topo da home */
  if('scrollRestoration' in history)history.scrollRestoration='manual';
  window.addEventListener('load',()=>window.scrollTo(0,0));
  window.scrollTo(0,0);