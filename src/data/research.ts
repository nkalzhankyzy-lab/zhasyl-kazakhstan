// Әлемдік зерттеулер: кабинет ауасы, ылғалдылық және бөлме гүлдері.
// Әр жазба жарияланған ғылыми мақалаға сүйенеді. Сандар мақаланың аннотациясы мен
// қорытындысынан алынды; дәлдігін түпнұсқадан тексеру керек.

export type ResearchTopic = "co2" | "plants" | "humidity" | "wellbeing";

export const TOPIC_LABEL: Record<ResearchTopic, string> = {
  co2: "CO₂ және оқу",
  plants: "Гүлдер және ауа",
  humidity: "Ылғалдылық",
  wellbeing: "Гүлдер және көңіл-күй",
};

export interface Research {
  id: string;
  topic: ResearchTopic;
  authors: string;
  year: number;
  country: string;
  title: string;
  journal: string;
  /** Не тапты (қысқа) */
  finding: string;
  /** Біздің жобаға қатысы */
  forUs: string;
  url: string;
}

export const RESEARCH: Research[] = [
  {
    id: "satish-2012",
    topic: "co2",
    authors: "Satish U., Mendell M.J., Shekhar K. және т.б.",
    year: 2012,
    country: "АҚШ",
    title: "Is CO₂ an indoor pollutant? Direct effects of low-to-moderate CO₂ concentrations on human decision-making performance",
    journal: "Environmental Health Perspectives, 120(12)",
    finding:
      "22 ересек адам бөлмеде 600, 1000 және 2500 ppm CO₂ жағдайында шешім қабылдау тестін орындады. 1000 ppm кезінде 9 көрсеткіштің 6-уы айтарлықтай төмендеді, 2500 ppm кезінде нәтижелер күрт нашарлады.",
    forUs: "Сабақ соңында CO₂ 1000 ppm-нен асса, оқушылардың зейіні мен шешім қабылдауы төмендеуі мүмкін. Сондықтан экопаспортта 1000 ppm шегін қолданамыз.",
    url: "https://doi.org/10.1289/ehp.1104789",
  },
  {
    id: "allen-2016",
    topic: "co2",
    authors: "Allen J.G., MacNaughton P., Satish U. және т.б.",
    year: 2016,
    country: "АҚШ (Гарвард)",
    title: "Associations of cognitive function scores with carbon dioxide, ventilation, and volatile organic compound exposures in office workers",
    journal: "Environmental Health Perspectives, 124(6)",
    finding:
      "Кеңсе қызметкерлері 6 күн бойы әртүрлі ауа жағдайында жұмыс істеді. Жақсы желдетілген, CO₂ аз бөлмеде ойлау тестінің ұпайы әдеттегі кеңседен шамамен екі есе жоғары болды.",
    forUs: "Желдету тек «жағымды ауа» емес, ойлау қабілетіне тікелей әсер етеді. Үзілісте терезе ашу — ең арзан шешім.",
    url: "https://doi.org/10.1289/ehp.1510037",
  },
  {
    id: "wargocki-2020",
    topic: "co2",
    authors: "Wargocki P., Porras-Salazar J.A., Contreras-Espinoza S., Bahnfleth W.",
    year: 2020,
    country: "Дания, Коста-Рика, АҚШ",
    title: "The relationships between classroom air quality and children's performance in school",
    journal: "Building and Environment, 173",
    finding:
      "Көптеген мектеп зерттеулерін біріктірген шолу. Сыныптағы CO₂-ні шамамен 2100 ppm-нен 900 ppm-ге дейін төмендетсе, оқушылардың тапсырма орындау жылдамдығы шамамен 12%-ға артады деп бағаланды.",
    forUs: "Кабинет желдетуін жақсарту оқу нәтижесіне өлшенетін әсер береді. Экопаспорттағы «ауа» ұпайы осыған негізделген.",
    url: "https://backend.orbit.dtu.dk/ws/portalfiles/portal/255476175/1_s2.0_S0360132320301074_am.pdf",
  },
  {
    id: "shendell-2004",
    topic: "co2",
    authors: "Shendell D.G., Prill R., Fisk W.J., Apte M.G., Blake D., Faulkner D.",
    year: 2004,
    country: "АҚШ",
    title: "Associations between classroom CO₂ concentrations and student attendance in Washington and Idaho",
    journal: "Indoor Air, 14(5)",
    finding:
      "434 сыныпта CO₂ өлшенді. Сыныптағы CO₂ сырттағыдан 1000 ppm-ге көп болған сайын, оқушылардың сабаққа келмеуі 10–20%-ға артқан.",
    forUs: "Нашар желдетілген сыныпта оқушылар жиі ауырып, сабақ босатуы мүмкін. Бұл ауа сапасын бақылаудың тағы бір себебі.",
    url: "https://pubmed.ncbi.nlm.nih.gov/15330793/",
  },
  {
    id: "cummings-2019",
    topic: "plants",
    authors: "Cummings B.E., Waring M.S.",
    year: 2019,
    country: "АҚШ",
    title: "Potted plants do not improve indoor air quality: a review and analysis of reported VOC removal efficiencies",
    journal: "Journal of Exposure Science & Environmental Epidemiology, 30",
    finding:
      "30 жылғы зертханалық тәжірибелерді талдады. Кәдімгі желдетумен тең тазарту үшін бір шаршы метрге 10-нан 1000-ға дейін гүл керек болады. Яғни бөлме гүлдері ауаны іс жүзінде аз тазартады.",
    forUs: "Гүл CO₂-ні айтарлықтай азайтпайды, негізгі шешім — желдету. Біздің зерттеуде гүлдің әсерін ылғалдылық пен көңіл-күй арқылы бағалаймыз.",
    url: "https://doi.org/10.1038/s41370-019-0175-9",
  },
  {
    id: "wolverton-1989",
    topic: "plants",
    authors: "Wolverton B.C., Johnson A., Bounds K. (NASA)",
    year: 1989,
    country: "АҚШ",
    title: "Interior landscape plants for indoor air pollution abatement",
    journal: "NASA есебі",
    finding:
      "Тығыз жабық шағын камераларда хлорофитум, спатифиллум сияқты гүлдер бензол мен формальдегидті азайтқан. Бұл «гүл ауаны тазартады» деген танымал пікірдің бастауы.",
    forUs: "Тәжірибе жабық камерада жасалған, нағыз сыныпта әсер әлдеқайда аз (Cummings & Waring, 2019). Бұл ғылымда нәтижені шарттарымен бірге оқу керектігін көрсетеді.",
    url: "https://ntrs.nasa.gov/citations/19930073077",
  },
  {
    id: "lohr-1996",
    topic: "plants",
    authors: "Lohr V.I., Pearson-Mims C.H.",
    year: 1996,
    country: "АҚШ",
    title: "Particulate matter accumulation on horizontal surfaces in interiors: influence of foliage plants",
    journal: "Atmospheric Environment, 30(14)",
    finding: "Гүлдер қойылған бөлмелерде көлденең беттерге шөгетін шаң гүлсіз бөлмелерге қарағанда 20%-ға дейін аз болған.",
    forUs: "Гүлдер шаңды аздап азайтуы мүмкін. Мұны кабинетте ақ қағазға жиналған шаңды салыстыру арқылы тексеруге болады.",
    url: "https://public.wsu.edu/~lohr/hih/air/",
  },
  {
    id: "arundel-1986",
    topic: "humidity",
    authors: "Arundel A.V., Sterling E.M., Biggin J.H., Sterling T.D.",
    year: 1986,
    country: "Канада",
    title: "Indirect health effects of relative humidity in indoor environments",
    journal: "Environmental Health Perspectives, 65",
    finding:
      "Бактериялар, вирустар, саңырауқұлақ пен шаң кенелері үшін ең қолайсыз жағдай — салыстырмалы ылғалдылық 40–60% аралығы. Ауа тым құрғақ немесе тым ылғал болса, денсаулыққа қауіп артады.",
    forUs: "Экопаспорттағы ылғалдылық ұпайы 40–60%-ға толық ұпай береді. Қызылорданың құрғақ ауасында кабинеттер көбіне 40%-дан төмен.",
    url: "https://doi.org/10.1289/ehp.8665351",
  },
  {
    id: "fjeld-1998",
    topic: "humidity",
    authors: "Fjeld T., Veiersted B., Sandvik L., Riise G., Levy F.",
    year: 1998,
    country: "Норвегия",
    title: "The effect of indoor foliage plants on health and discomfort symptoms among office workers",
    journal: "Indoor and Built Environment, 7(4)",
    finding: "Кеңсеге гүл қойылғаннан кейін қызметкерлердің шаршау, жөтел, тамақ пен терінің құрғауы сияқты шағымдары шамамен 20–25%-ға азайған.",
    forUs: "Гүлдер ауаға су буын бөліп, құрғақтықты аздап жұмсартуы мүмкін. Біздің кабинеттердегі ылғалдылық өлшемдері осыны тексереді.",
    url: "https://karger.com/Article/Abstract/24583",
  },
  {
    id: "lee-2015",
    topic: "wellbeing",
    authors: "Lee M.S., Lee J., Park B.J., Miyazaki Y.",
    year: 2015,
    country: "Корея, Жапония",
    title: "Interaction with indoor plants may reduce psychological and physiological stress by suppressing autonomic nervous system activity in young adults",
    journal: "Journal of Physiological Anthropology, 34",
    finding: "Студенттер 15 минут гүл отырғызғаннан кейін компьютерде жұмыс істегенге қарағанда өздерін тынышырақ сезінген, қан қысымы төмендеген.",
    forUs: "Гүл күту — оқушылар үшін стресті азайтатын белсенділік. «Менің гүлім» бөлімі осыған негізделеді.",
    url: "https://doi.org/10.1186/s40101-015-0060-8",
  },
  {
    id: "bringslimark-2009",
    topic: "wellbeing",
    authors: "Bringslimark T., Hartig T., Patil G.G.",
    year: 2009,
    country: "Норвегия, Швеция",
    title: "The psychological benefits of indoor plants: a critical review of the experimental literature",
    journal: "Journal of Environmental Psychology, 29(4)",
    finding: "Бөлме гүлдері туралы тәжірибелерге сыни шолу. Гүлдердің көңіл-күйге, ауырсынуға және жұмысқа оң әсері жиі байқалады, бірақ көп зерттеудің іріктемесі шағын, нәтижелері әркелкі.",
    forUs: "Өз зерттеуімізде де іріктемені үлкейтіп, нәтижені абай қорытындылауымыз керек: 3 кабинет — бастама ғана.",
    url: "https://doi.org/10.1016/j.jenvp.2009.05.001",
  },
];

/** ЖИ-ге берілетін қысқа нұсқа */
export function researchContext(): string {
  return (
    "ӘЛЕМДІК ЗЕРТТЕУЛЕР (тексерілген тізім; сілтеме жасағанда тек осыларды «Автор, жыл» түрінде ата):\n" +
    RESEARCH.map((r) => `- ${r.authors.split(",")[0]} (${r.year}), ${r.country}: ${r.finding}`).join("\n")
  );
}
