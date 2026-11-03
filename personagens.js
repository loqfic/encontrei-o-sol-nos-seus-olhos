/*
  ============================================================
  MORADORAS (E VIZINHANÇA) DE "ENCONTREI O SOL NOS SEUS OLHOS"
  ============================================================

  COMO TROCAR A FOTO DE UMA PERSONAGEM:
  Envie a imagem para o GitHub (junto com os outros arquivos, sem pasta)
  com o MESMO nome que está em "foto" abaixo. Ex.: para o Léo, salve a foto
  como leo.jpg e pronto.

  - Sem foto, o cartão mostra um círculo com a inicial do nome.
  - Quer usar .png ou .webp? Mude também o final em "foto" (ex.: "leo.png").
  - Fotos em pé (retrato) ficam melhores.

  COMO EDITAR OU ADICIONAR:
  - descricaoCurta: verso do cartão (1 ou 2 frases).
  - (Opcional) descricaoLonga: aparece o botão "Ver mais" com o texto todo.
  - grupo: "casa" (quem mora no apartamento) ou "visitas" (o resto).
  - Para adicionar alguém, copie um bloco "{ ... }," inteiro e cole antes
    do "];" no fim do arquivo.
  - Não mude o "id" de lorena, eduarda e cadu: as páginas de leitura e do
    apartamento usam eles para achar as fotos.
  ============================================================
*/

const PERSONAGENS = [
  {
    id: "lorena",
    grupo: "casa",
    nome: "Lorena Ferette",
    apelido: "Lorena",
    papel: "Estudante de design e estagiária",
    descricaoCurta: "Expulsa de casa pelo pai por gostar de mulheres, passou três meses no quarto de visitas da Maggye até decidir que era hora de ter o próprio canto.",
    descricaoLonga: "Lorena estuda design e divide os dias entre a faculdade e um estágio numa empresa grande. Depois do dia catorze em que o pai a mandou embora, ela foi morar com a melhor amiga, Maggye, mas não queria depender da boa vontade da família dela para sempre.\n\nFoi assim que chegou ao apartamento da Juquinha: uma conversa na mesa da cozinha, um gato que não gosta de visitas e uma metade do aluguel que, por algum milagre, cabia no orçamento.",
    foto: "lorena.jpg"
  },
  {
    id: "eduarda",
    grupo: "casa",
    nome: "Eduarda Fragoso",
    apelido: "Juquinha · Duda",
    papel: "Policial",
    descricaoCurta: "Ruiva, policial e mãe do Cadu. Com os pais morando em outra cidade, o apartamento ficou grande demais e ela foi procurar uma colega para dividir.",
    descricaoLonga: "Juquinha tem uma regra muito clara na cabeça: em hipótese alguma se envolver com a colega de apartamento. Seria receita para dor de cabeça.\n\nEla trabalha na delegacia com o Paulinho, faz plantão, cozinha para quem mora com ela e deixa bilhete quando sai cedo. Também é a única pessoa no mundo que chamaria um gato de Mike Wazowski.",
    foto: "eduarda.jpg"
  },
  {
    id: "cadu",
    grupo: "casa",
    nome: "Cadu",
    apelido: "Cadu",
    papel: "Gato da Juquinha · o filho da casa",
    descricaoCurta: "Odeia visitas, corre para o quarto quando chega gente nova e fica aos pés de quem está passando o café.",
    descricaoLonga: "\"Esse é o Cadu, meu filho\", foi assim que a Juquinha apresentou o gato. O nome, segundo ela, tem influência do Cadu Maverick. Ela tinha esperança de que ele fosse surfista, mas ele não gosta muito de água.",
    foto: "cadu.jpg"
  },
  {
    id: "maggye",
    grupo: "visitas",
    nome: "Maggye",
    apelido: "Maggye",
    papel: "Melhor amiga da Lorena",
    descricaoCurta: "Abriu a porta no meio da noite quando a Lorena mais precisou e foi quem apresentou as duas. Sempre com um sorriso no rosto.",
    foto: "maggye.jpg"
  },
  {
    id: "junior",
    grupo: "visitas",
    nome: "Júnior",
    apelido: "Júnior",
    papel: "Sempre junto da Maggye",
    descricaoCurta: "Faz dupla com a Maggye nos convites para o bar e no olhar de preocupação com a Lorena.",
    foto: "junior.jpg"
  },
  {
    id: "paulinho",
    grupo: "visitas",
    nome: "Paulinho",
    apelido: "Paulinho",
    papel: "Colega de delegacia da Juquinha",
    descricaoCurta: "Um dos melhores amigos da Juquinha. Manda mensagem quando o plantão está um tédio e cobre o turno dela quando precisa.",
    foto: "paulinho.jpg"
  },
  {
    id: "gerluce",
    grupo: "visitas",
    nome: "Gerluce",
    apelido: "Gerluce",
    papel: "Namorada do Paulinho",
    descricaoCurta: "Virou amiga da Juquinha também. Olha para o namorado com olhos de apaixonada, para desespero da amiga.",
    foto: "gerluce.jpg"
  },
  {
    id: "leo",
    grupo: "visitas",
    nome: "Léo",
    apelido: "Léo",
    papel: "Irmão da Lorena",
    descricaoCurta: "Estava na casa no dia em que tudo desandou e tentou argumentar com o pai. Continua do lado da irmã.",
    foto: "leo.jpg"
  },
  {
    id: "zenilda",
    grupo: "visitas",
    nome: "Zenilda",
    apelido: "Dona Zenilda",
    papel: "Mãe da Lorena",
    descricaoCurta: "Chorou e implorou naquele dia. Desde então, volta e meia manda mensagem tentando recuperar a relação com a filha.",
    foto: "zenilda.jpg"
  },
  {
    id: "violeta",
    grupo: "visitas",
    nome: "Violeta",
    apelido: "Violeta",
    papel: "Mãe da Juquinha",
    descricaoCurta: "Mora em outra cidade, mas sempre nota quando a filha está conversando com alguém com um sorriso bobo no rosto.",
    foto: "violeta.jpg"
  },
  {
    id: "santiago",
    grupo: "visitas",
    nome: "Santiago Ferette",
    apelido: "Ferette",
    papel: "Pai da Lorena",
    descricaoCurta: "À frente da Fundação Ferette, não é o tipo de homem que foge de um conflito. Foi ele quem mandou a filha sair de casa.",
    foto: "santiago.jpg"
  },
  {
    id: "jairo",
    grupo: "visitas",
    nome: "Jairo",
    apelido: "Delegado Jairo",
    papel: "Chefe da Juquinha",
    descricaoCurta: "O delegado. Ninguém quer que ele chegue na delegacia antes da hora, principalmente quando alguém faltou ao plantão.",
    foto: "jairo.jpg"
  },
];
