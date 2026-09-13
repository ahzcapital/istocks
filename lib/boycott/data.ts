import type {BoycottCategory,BoycottEntry} from './types';

const SEED_ENTRIES: BoycottEntry[] = [
  {id:'carrefour',rank:1,company:'Carrefour',product:'Carrefour',category:'grocery',reason:'Targeted in documented Palestine-related boycott campaigns; BDS identifies Carrefour as a priority target.',status:'Documented campaign',source:'BDS / North Africa campaigns',sourceUrl:'https://bdsmovement.net/Guide-to-BDS-Boycott',confidence:'high',campaignType:'BDS priority / regional campaign',aliases:['Carrefour Market']},
  {id:'mcdonalds',rank:2,company:"McDonald's",product:"McDonald's",category:'food',reason:"Targeted by documented consumer boycott campaigns in Egypt and other Arab countries; BDS also lists McDonald's among its priority targets.",status:'Documented campaign',source:'BDS / regional campaigns',sourceUrl:'https://bdsmovement.net/Guide-to-BDS-Boycott',confidence:'high',campaignType:'BDS priority / regional campaign',aliases:['McD','McDonalds']},
];

const SOURCE_URL='https://www.is-boycott.com/en/all/companies';
const SOURCE_LABEL='Is-Boycott company database';

export const CATEGORY_LABELS:Record<BoycottCategory,string>={food:'Food & Restaurants',beverages:'Beverages',grocery:'Grocery & Supermarkets',fashion:'Fashion & Clothing',beauty:'Beauty & Personal Care',household:'Household',baby:'Baby & Family',technology:'Technology',software:'Software & Internet',finance:'Finance & Banking',travel:'Travel & Hospitality',automotive:'Transportation & Automotive',energy:'Energy',media:'Entertainment & Media',healthcare:'Healthcare & Pharmaceuticals',industrial:'Industrial',construction:'Construction & Real Estate',agriculture:'Agriculture',logistics:'Logistics',retail:'Retail',other:'Other'};

const CATEGORY_RULES:Array<[BoycottCategory,RegExp]>=[
  ['food',/mcdonald|burger|restaurant|pizza|kfc|starbucks|coffee|dunkin|caribou|hardee|domino|papa john|subway|wendy|taco|wok|bakery|winery/i],
  ['beverages',/coca.?cola|pepsi|red bull|nestle|aquafina|dasani|fanta|sprite|7up|mirinda|mountain dew|heineken|barbican|rani/i],
  ['grocery',/carrefour|supermarket|shufersal|grocery|geant|spinneys|panda|seoudi|metro|lulu|kazyon|bim/i],
  ['fashion',/zara|puma|chanel|nike|adidas|fashion|clothing|pull&bear|stradivarius|lefties|aéropostale|aeropostale|swarovski|brooks brothers|salomon|quiksilver|volcom|roxy|dockers/i],
  ['beauty',/l.?oreal|loreal|cerave|maybelline|garnier|dove|rexona|axe|vaseline|gillette|olay|pantene|schwarzkopf|neutrogena|johnson|beauty|cosmetic/i],
  ['household',/unilever|henkel|sc johnson|persil|pril|ariel|tide|downy|comfort|cif|vanish|detto|windex|glade|pledge|raid|clorox|cleaning|household/i],
  ['baby',/pampers|huggies|gerber|molfix|cerelac|nan|mustela|sanosan|baby|infant/i],
  ['technology',/samsung|apple|sony|lg|toshiba|hp|dell|intel|nvidia|microsoft|huawei|xiaomi|oppo|ibm|google|meta|palantir|mobileye|hitachi|dji|technology|electronics/i],
  ['software',/github|vercel|linkedin|youtube|netflix|spotify|waze|wix|wordpress|godaddy|kaggle|open.?table|tripadvisor|trivago|software|cloud|vpn|cyberghost/i],
  ['finance',/bank|banking|insurance|pimco|ishares|etoro|barclays|finance|capital/i],
  ['travel',/booking|hotel|airbnb|expedia|orbitz|priceline|kayak|ebookers|hotels\.com|rentalcars|cheapflights|tripadvisor|travel|cruise/i],
  ['automotive',/toyota|volkswagen|ford|jaguar|land rover|mitsubishi|general motors|hyundai|automotive/i],
  ['energy',/bp|chevron|caltex|exxon|mobil|solar|energix|renewable|energy|oil|gas/i],
  ['media',/disney|espn|politico|spotify|youtube|media|broadcast|publishing/i],
  ['healthcare',/teva|roche|bayer|pharmaceutical|pharma|medical|health|hospital|laborator/i],
  ['industrial',/abb|fanuc|atlas copco|bomag|cnh|doosan|fassi|general electric|garrett|terex|liebher|manitou|industrial|systems/i],
  ['construction',/building|construction|cement|materials|ashtrom|shapir|shikun|real estate|properties/i],
  ['agriculture',/agro|fertilizer|fertilizers|grower|agriculture|rivulis|hadiklaim/i],
  ['logistics',/maersk|zim|shipping|logistics|rail|egged/i],
  ['retail',/retail|stores|market|shopping/i],
];

function cleanCompanyName(value:string){return value.replace(/\s*Company\s*$/i,'').replace(/\s*\([^)]*\)\s*$/g,'').replace(/Company$/i,'').trim();}
function slugify(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
function inferCategory(company:string):BoycottCategory{for(const [category,pattern] of CATEGORY_RULES)if(pattern.test(company))return category;return 'other';}
function aliasesFor(company:string):string[]{
  const aliases:Record<string,string[]>={
    'Coca-Cola':['Coke','Coca Cola'],
    "McDonald's":['McDonalds','McD'],
    Facebook:['Meta'],
    Meta:['Facebook','Instagram','WhatsApp'],
    Google:['YouTube'],
    'P&G':['Procter & Gamble'],
    "L’Oréal":['L Oreal',"L'Oreal"],
    "L'Oréal":['L Oreal','L’Oréal'],
  };
  return aliases[company]??[];
}

export async function getBoycottEntries():Promise<BoycottEntry[]>{
  try{
    const response=await fetch(SOURCE_URL,{next:{revalidate:21600},headers:{'user-agent':'North-Africa-Hub-Boycott-Reference/1.0'}});
    if(!response.ok)throw new Error(`Boycott source returned ${response.status}`);
    const html=await response.text();
    const matches=Array.from(html.matchAll(/<a[^>]+href=["']\/en\/c\/[^"']+["'][^>]*>([\s\S]*?)<\/a>/gi));
    const sourceEntries:BoycottEntry[]=[];
    const seen=new Set(SEED_ENTRIES.map(entry=>entry.company.toLowerCase()));
    for(const match of matches){
      const raw=match[1].replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
      const company=cleanCompanyName(raw);if(!company||company.length<2)continue;
      const key=company.toLowerCase();if(seen.has(key))continue;seen.add(key);
      sourceEntries.push({id:`source-${slugify(company)}`,rank:0,company,product:company,category:inferCategory(company),aliases:aliasesFor(company),reason:'Listed in the source database. The database combines BDS priority targets, Who Profits research, OHCHR-related company records, and other boycott research; inclusion does not mean every entry is an official BDS consumer target.',status:'Source database entry',source:SOURCE_LABEL,sourceUrl:SOURCE_URL,confidence:'medium',campaignType:'Third-party research database'});
    }
    return [...SEED_ENTRIES,...sourceEntries].map((entry,index)=>({...entry,rank:index+1}));
  }catch{return SEED_ENTRIES;}
}

export const BOYCOTT_ENTRIES:BoycottEntry[]=SEED_ENTRIES;
