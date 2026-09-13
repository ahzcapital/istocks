export type NorthAfricaCountry={code:string;name:string;slug:string;flag:string;availableSections:string[]};
export const NORTH_AFRICA_COUNTRIES:NorthAfricaCountry[]=[
 {code:'EG',name:'Egypt',slug:'egypt',flag:'🇪🇬',availableSections:['history','markets','economy','companies','travel','culture','geography','people','government','data','food','cinema','boycott']},
 {code:'LY',name:'Libya',slug:'libya',flag:'🇱🇾',availableSections:['history','economy','travel','culture','geography','people','government','data','food','cinema','boycott']},
 {code:'TN',name:'Tunisia',slug:'tunisia',flag:'🇹🇳',availableSections:['history','markets','economy','companies','travel','culture','geography','people','government','data','food','cinema','boycott']},
 {code:'DZ',name:'Algeria',slug:'algeria',flag:'🇩🇿',availableSections:['history','markets','economy','companies','travel','culture','geography','people','government','data','food','cinema','boycott']},
 {code:'MA',name:'Morocco',slug:'morocco',flag:'🇲🇦',availableSections:['history','markets','economy','companies','travel','culture','geography','people','government','data','food','cinema','boycott']},
];
export const NORTH_AFRICA_BY_SLUG=Object.fromEntries(NORTH_AFRICA_COUNTRIES.map(c=>[c.slug,c])) as Record<string,NorthAfricaCountry>;
export const NORTH_AFRICA_SECTIONS=[
 {id:'markets',label:'Markets',href:'/markets',group:'primary'},
 {id:'history',label:'History',href:'/history',group:'primary'},
 {id:'food',label:'Food',href:'/food',group:'primary'},
 {id:'cinema',label:'Cinema',href:'/cinema',group:'primary'},
 {id:'people',label:'People',href:'/people',group:'primary'},
 {id:'boycott',label:'Boycott',href:'/boycott',group:'primary'},
 {id:'vision',label:'Vision',href:'/vision',group:'institutional'},
] as const;
export function getCountryBySlug(slug:string){return NORTH_AFRICA_BY_SLUG[slug.toLowerCase()]};
export function getSection(id:string){return NORTH_AFRICA_SECTIONS.find(x=>x.id===id)};
export const SECTION_CONTENT:Record<string,{eyebrow:string;title:string;description:string;topics:string[]}>= {
 history:{eyebrow:'North Africa',title:'History',description:'A structured home for the history of Egypt, Libya, Tunisia, Algeria and Morocco, including regional stories that cross modern borders.',topics:['Ancient North Africa','Amazigh civilizations','Carthage and Phoenician North Africa','Roman North Africa','Islamic dynasties','Ottoman North Africa','Colonial period','Independence and modern history']},
 food:{eyebrow:'North Africa',title:'Food',description:'A future culinary knowledge section for the dishes, ingredients, traditions and regional food cultures of North Africa.',topics:['Egyptian cuisine','Libyan cuisine','Tunisian cuisine','Algerian cuisine','Moroccan cuisine','Dishes','Ingredients','Street food','Desserts','Culinary traditions']},
 cinema:{eyebrow:'North Africa',title:'Cinema',description:'A future North African cinema knowledge section for films, filmmakers, movements, history and cultural impact.',topics:['Countries','Films','Directors','Actors','Cinema history','Film movements','Awards','Cultural impact']},
 economy:{eyebrow:'North Africa',title:'Economy',description:'A future-ready economic data section designed for verified cross-country indicators and comparisons.',topics:['GDP','GDP growth','Inflation','Interest rates','Government debt','Foreign reserves','Trade','Tourism','Energy','Foreign investment']},
 companies:{eyebrow:'North Africa',title:'Companies',description:'A broader company directory connecting listed companies to a future North African business ecosystem.',topics:['Public companies','Private companies','Banks','Telecom','Energy','Industrials','Technology','Consumer','Healthcare','Transportation']},
 travel:{eyebrow:'North Africa',title:'Travel',description:'A structured guide to destinations, cities, heritage and experiences across North Africa.',topics:['Cities','Historical sites','Beaches','Mountains','Deserts','Museums','UNESCO sites','Activities','Travel guides','Food']},
 culture:{eyebrow:'North Africa',title:'Culture',description:'An educational framework for languages, music, food, art, literature, architecture and living traditions.',topics:['Languages','Arabic dialects','Amazigh languages','Music','Food','Art','Literature','Cinema','Architecture','Traditions']},
 geography:{eyebrow:'North Africa',title:'Geography',description:'A geographic index for countries, regions, cities, landscapes, climate and natural resources.',topics:['Countries','Regions','Cities','Mountains','Deserts','Rivers','Lakes','Coastlines','Climate','Natural resources']},
 people:{eyebrow:'North Africa',title:'People',description:'The human map of North Africa: a structured catalogue of people across history, business, culture, cinema, science, sports, literature, politics and entrepreneurship.',topics:['History','Business','Culture','Cinema','Science','Sports','Literature','Politics','Entrepreneurship']},
 government:{eyebrow:'North Africa',title:'Government',description:'A factual, politically neutral index of institutions and administrative structures.',topics:['Political systems','Government structure','Heads of state','Parliaments','Administrative divisions','Elections','Constitutional structures']},
 data:{eyebrow:'North Africa',title:'North Africa Data',description:'A quantitative layer for cross-country comparison across markets, economies, people, trade, tourism and energy.',topics:['Markets','Economy','Population','Trade','Tourism','Energy','Currencies','Commodities','Demographics']},
 map:{eyebrow:'North Africa',title:'Interactive Map',description:'The future geographic layer for exploring countries, cities, regions, destinations and verified data points.',topics:['Countries','Cities','Regions','Tourist destinations','Historical sites','Economic data','Population data']},
 about:{eyebrow:'North Africa Hub',title:'About',description:'North Africa Hub is evolving from a stock-market product into a broader North African information and data platform.',topics:['North Africa','Markets','Data','Research','Information architecture']},
 sources:{eyebrow:'North Africa Hub',title:'Sources',description:'A dedicated home for source transparency as new information domains are connected.',topics:['Financial sources','Economic datasets','Government sources','Historical sources','Geographic datasets']},
 boycott:{eyebrow:'North Africa',title:'Boycott',description:'A structured reference for documented boycott campaigns and targeted products across North Africa.',topics:['Boycott campaigns','Targeted companies','Products','Reasons','Sources']},
 vision:{eyebrow:'North Africa Hub',title:'Vision',description:'North Africa Hub is building a long-term platform connecting North African markets, knowledge, culture and people through structured, verifiable information.',topics:['Our vision','Connecting North Africa','Economic development','Culture','Technology','Long-term ambition']},
};
