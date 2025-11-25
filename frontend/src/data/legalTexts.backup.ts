// Sample legal text data based on Konkurslagen (1987:672)
// In production, this would be loaded from a database or API

export type Section = {
  id: string;
  number: number;
  text: string;
  references: string[];
};

export type Chapter = {
  id: string;
  number: number;
  title: string;
  sections: Section[];
};

export type LegalText = {
  id: string;
  title: string;
  sfsNumber: string;
  department: string;
  issued: string;
  lastAmended: string;
  chapters: Chapter[];
};

export const legalTexts: LegalText[] = [
  {
    id: 'sfs-1987-672',
    title: 'Konkurslag (1987:672)',
    sfsNumber: '1987:672',
    department: 'Justitiedepartementet L2',
    issued: '1987-06-11',
    lastAmended: 't.o.m. SFS 2025:796',
    chapters: [
      {
        id: 'kap-1',
        number: 1,
        title: 'Inledande bestämmelser',
        sections: [
          {
            id: 'kap-1-§-1',
            number: 1,
            text: 'Genom konkurs tar en gäldenärs samtliga borgenärer i ett sammanhang tvångsvis i anspråk gäldenärens samlade tillgångar för betalning av sina fordringar. Under konkurs omhändertas tillgångarna för borgenärernas räkning av konkursboet.',
            references: [],
          },
          {
            id: 'kap-1-§-2',
            number: 2,
            text: 'En gäldenär som är på obestånd skall efter egen eller en borgenärs ansökan försättas i konkurs, om inte annat är föreskrivet. Med obestånd (insolvens) avses att gäldenären inte kan rätteligen betala sina skulder och att denna oförmåga inte är endast tillfällig.',
            references: [],
          },
          {
            id: 'kap-1-§-3',
            number: 3,
            text: 'Förvaltningen av ett konkursbo handhas av en eller flera förvaltare. Tillsynsmyndigheten utövar tillsyn över förvaltningen. Tillsynsmyndigheten utför även de andra uppgifter som anges i denna lag.',
            references: [],
          },
          {
            id: 'kap-1-§-4',
            number: 4,
            text: 'Ett konkursbo som är på obestånd kan försättas i konkurs. Vad som är föreskrivet i denna lag om gäldenär skall i sådana fall gälla konkursboet.',
            references: [],
          },
          {
            id: 'kap-1-§-5',
            number: 5,
            text: 'Med panträtt i fast egendom jämställs vid tillämpningen av denna lag annan särskild förmånsrätt som gäller i egendomen och inte grundas på utmätning. Vad som sägs om borgenär med handpanträtt i lös egendom tillämpas också i fråga om borgenär med rätt att hålla kvar lös egendom till säkerhet för fordran (retentionsrätt).',
            references: [],
          },
        ],
      },
      {
        id: 'kap-2',
        number: 2,
        title: 'Konkursansökan och konkursbeslut',
        sections: [
          {
            id: 'kap-2-§-1',
            number: 1,
            text: 'En ansökan om konkurs görs skriftligen till tingsrätten. Sökanden ska ange och styrka de omständigheter som gör rätten behörig, om de inte är kända. En ansökan ska avvisas, om det inte av den framgår vilken tingsrätt som är behörig och sökanden inte följer ett föreläggande att avhjälpa bristen.',
            references: [],
          },
          {
            id: 'kap-2-§-2',
            number: 2,
            text: 'En enskilds konkursansökan ska vara egenhändigt undertecknad av sökanden eller sökandens ombud. Om ansökan ges in elektroniskt, ska den skrivas under med en sådan avancerad elektronisk underskrift som avses i artikel 3 i Europaparlamentets och rådets förordning (EU) nr 910/2014.',
            references: [],
          },
          {
            id: 'kap-2-§-7',
            number: 7,
            text: 'En uppgift av gäldenären att han är insolvent skall godtas, om det inte finns särskilda skäl att inte göra det.',
            references: [],
          },
          {
            id: 'kap-2-§-8',
            number: 8,
            text: 'Om inte annat visas, anses en gäldenär vara insolvent, när det vid verkställighet enligt 4 kap. utsökningsbalken inom de senaste sex månaderna före konkursansökningen har framgått att han saknat tillgångar till full betalning av utmätningsfordringen. Detsamma gäller, om gäldenären har förklarat sig ställa in sina betalningar.',
            references: ['4 kap. utsökningsbalken'],
          },
        ],
      },
      {
        id: 'kap-3',
        number: 3,
        title: 'Verkningar av konkurs',
        sections: [
          {
            id: 'kap-3-§-1',
            number: 1,
            text: 'Sedan ett beslut om konkurs har meddelats, får gäldenären inte råda över egendom som hör till konkursboet. Han får inte heller åta sig sådana förbindelser som kan göras gällande i konkursen.',
            references: [],
          },
          {
            id: 'kap-3-§-3',
            number: 3,
            text: 'Till ett konkursbo räknas, i den mån inte något annat följer av 2 §, all egendom som tillhörde gäldenären när konkursbeslutet meddelades eller tillfaller honom under konkursen och som är sådan att den kan utmätas. Till konkursboet räknas även den egendom som kan tillföras boet genom återvinning enligt 4 kap.',
            references: ['3 kap. 2 §', '4 kap.'],
          },
        ],
      },
      {
        id: 'kap-4',
        number: 4,
        title: 'Återvinning till konkursbo',
        sections: [
          {
            id: 'kap-4-§-1',
            number: 1,
            text: 'Återvinning till konkursbo får på begäran av boet ske i enlighet med vad som anges i detta kapitel. Återvinning får dock inte ske av betalning av skatt eller avgift som omfattas av skatteförfarandelagen (2011:1244), skatt enligt vägtrafikskattelagen (2006:227) eller lagen (2006:228) med särskilda bestämmelser om fordonsskatt, tull och ränta på belopp som var förfallet till betalning.',
            references: [],
          },
          {
            id: 'kap-4-§-5',
            number: 5,
            text: 'En rättshandling, varigenom på ett otillbörligt sätt en viss borgenär har gynnats framför andra eller gäldenärens egendom har undandragits borgenärerna eller hans skulder har ökats, går åter, om gäldenären var eller genom förfarandet blev insolvent samt den andre kände till eller borde ha känt till gäldenärens insolvens och de omständigheter som gjorde rättshandlingen otillbörlig.',
            references: [],
          },
          {
            id: 'kap-4-§-6',
            number: 6,
            text: 'En gåva går åter, om den har fullbordats senare än sex månader före fristdagen. En gåva som har fullbordats dessförinnan men senare än ett år eller, när den har skett till någon som är närstående till gäldenären, tre år före fristdagen går åter, om det inte visas att gäldenären efter gåvan hade kvar utmätningsbar egendom som uppenbart motsvarade hans skulder.',
            references: [],
          },
        ],
      },
      {
        id: 'kap-5',
        number: 5,
        title: 'Fordringar i konkurs',
        sections: [
          {
            id: 'kap-5-§-1',
            number: 1,
            text: 'Fordran hos gäldenären får göras gällande i konkursen endast om den, där så erfordras, har anmälts genom bevakning. Bevakning sker i den ordning som föreskrivs i 9 kap.',
            references: ['9 kap.'],
          },
        ],
      },
      {
        id: 'kap-7',
        number: 7,
        title: 'Förvaltning och tillsyn',
        sections: [
          {
            id: 'kap-7-§-1',
            number: 1,
            text: 'Förvaltaren skall verka för en ändamålsenlig och snabb konkursförvaltning. Han skall tillvarata borgenärernas och övriga berörda parters rätt och ta till vara konkursboets intressen.',
            references: [],
          },
        ],
      },
    ],
  },
  {
    id: 'sfs-2005-551',
    title: 'Aktiebolagslag (2005:551) - Konkursrelevanta avsnitt',
    sfsNumber: '2005:551',
    department: 'Justitiedepartementet',
    issued: '2005-04-28',
    lastAmended: 't.o.m. SFS 2024:862',
    chapters: [
      {
        id: 'kap-25',
        number: 25,
        title: 'Likvidation',
        sections: [
          {
            id: 'kap-25-§-1',
            number: 1,
            text: 'Ett aktiebolag ska gå i likvidation om bolaget ska upplösas på annat sätt än genom fusion eller delning eller om ett beslut om att likvidera bolaget har fattats.',
            references: [],
          },
          {
            id: 'kap-25-§-13',
            number: 13,
            text: 'Om ett bolag under likvidation är på obestånd, ska likvidatorn genast ansöka om att bolaget försätts i konkurs. Ansökan får underlåtas om likvidatorn bedömer att bolagets tillgångar uppenbarligen inte räcker till betalning av konkurskostnaderna.',
            references: [],
          },
        ],
      },
    ],
  },
  {
    id: 'sfs-1982-80',
    title: 'Lag (1982:80) om anställningsskydd (LAS)',
    sfsNumber: '1982:80',
    department: 'Arbetsmarknadsdepartementet',
    issued: '1982-03-04',
    lastAmended: 't.o.m. SFS 2024:851',
    chapters: [
      {
        id: 'kap-1',
        number: 1,
        title: 'Allmänna bestämmelser',
        sections: [
          {
            id: 'kap-1-§-1',
            number: 1,
            text: 'Denna lag gäller anställning som innebär skyldighet för arbetstagaren att personligen utföra arbete. Lagen gäller inte anställning i arbetsgivarens hushåll eller anställning i arbetsgivarens familj.',
            references: [],
          },
        ],
      },
      {
        id: 'kap-2',
        number: 2,
        title: 'Anställningens upphörande',
        sections: [
          {
            id: 'kap-2-§-1',
            number: 1,
            text: 'Arbetsgivaren får säga upp en arbetstagare endast om det finns saklig grund för uppsägningen.',
            references: [],
          },
        ],
      },
    ],
  },
  {
    id: 'sfs-1977-480',
    title: 'Semesterlag (1977:480)',
    sfsNumber: '1977:480',
    department: 'Arbetsmarknadsdepartementet',
    issued: '1977-05-26',
    lastAmended: 't.o.m. SFS 2024:851',
    chapters: [
      {
        id: 'kap-1',
        number: 1,
        title: 'Tillämpningsområde m.m.',
        sections: [
          {
            id: 'kap-1-§-1',
            number: 1,
            text: 'Denna lag gäller för arbetstagare. Med arbetstagare avses i denna lag den som åtagit sig att utföra arbete i en annans tjänst.',
            references: [],
          },
        ],
      },
      {
        id: 'kap-2',
        number: 2,
        title: 'Semester och semesterlön',
        sections: [
          {
            id: 'kap-2-§-7',
            number: 7,
            text: 'Arbetstagaren har rätt till semesterlön under sin semester. Semesterlönen ska beräknas enligt bestämmelserna i 26–35 §§.',
            references: ['2 kap. 26-35 §§'],
          },
        ],
      },
    ],
  },
];
