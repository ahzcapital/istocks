export const PERSON_CATEGORIES = ['History','Politics','Business','Entrepreneurship','Science','Technology','Medicine','Cinema','Music','Literature','Art','Culture','Sports','Architecture','Media','Education'] as const;
export type PersonCategory = typeof PERSON_CATEGORIES[number];
export const PERSON_PERIODS = ['Ancient','Classical','Medieval','Early Modern','Colonial','Independence','Modern','Contemporary'] as const;
export type PersonPeriod = typeof PERSON_PERIODS[number];

export type PersonSource = {title:string;url:string;publisher?:string;accessedAt?:string};
export type PersonTimelineEvent = {date:string;title:string;description:string};
export type Person = {
  id:string; slug:string; name:string; nativeName?:string; alternateNames?:string[];
  countries:string[]; nationality?:string[]; categories:PersonCategory[];
  birthDate?:string; deathDate?:string; birthPlace?:string; deathPlace?:string;
  occupations:string[]; shortDescription:string; biography:string; image?:string;
  imageCredit?:string; imageSource?:string; historicalPeriods?:PersonPeriod[];
  knownFor?:string[]; achievements?:string[]; timeline?:PersonTimelineEvent[];
  sources:PersonSource[]; relatedPeople?:string[]; featured?:boolean;
};

export type RankedPerson = Person & {likes:number;dislikes:number;netLikes:number;rank:number;userVote:'like'|'dislike'|'none'};
