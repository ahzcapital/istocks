import {cookies} from 'next/headers';
import {randomUUID, createHash} from 'crypto';
import {prisma} from '@/lib/prisma';
import {PUBLIC_PEOPLE} from './data';
import type {RankedPerson} from './types';

export const PEOPLE_PAGE_SIZE = 50;
const VOTER_COOKIE = 'na_people_voter';

function hashVoter(value:string){return createHash('sha256').update(value).digest('hex');}

export async function getVoterKey(){
  const jar=await cookies();
  let value=jar.get(VOTER_COOKIE)?.value;
  if(!value){
    value=randomUUID();
    jar.set(VOTER_COOKIE,value,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',maxAge:60*60*24*365*2,path:'/'});
  }
  return hashVoter(value);
}

async function getExistingVoterKey(){
  const value=(await cookies()).get(VOTER_COOKIE)?.value;
  return value?hashVoter(value):null;
}

export async function getVoteStats(){
  try{
    const rows=await prisma.personVote.groupBy({by:['personId','vote'],_count:{_all:true}});
    const stats=new Map<string,{likes:number;dislikes:number}>();
    for(const row of rows){const current=stats.get(row.personId)??{likes:0,dislikes:0};if(row.vote==='like')current.likes=row._count._all;else current.dislikes=row._count._all;stats.set(row.personId,current);}
    return stats;
  }catch{return new Map<string,{likes:number;dislikes:number}>();}
}

export async function getUserVotes(personIds:string[]){
  if(!personIds.length)return new Map<string,'like'|'dislike'>();
  try{
    const voterKey=await getExistingVoterKey();
    if(!voterKey)return new Map<string,'like'|'dislike'>();
    const rows=await prisma.personVote.findMany({where:{voterKey,personId:{in:personIds}},select:{personId:true,vote:true}});
    return new Map(rows.map(row=>[row.personId,row.vote] as const));
  }catch{return new Map<string,'like'|'dislike'>();}
}

export async function rankPeople(params:{q?:string;country?:string;category?:string;period?:string;sort?:string}){
  const q=params.q?.trim().toLocaleLowerCase()??'';
  const people=PUBLIC_PEOPLE.filter(person=>{
    if(params.country&&params.country!=='all'&&!person.countries.includes(params.country))return false;
    if(params.category&&params.category!=='all'&&!person.categories.includes(params.category as never))return false;
    if(params.period&&params.period!=='all'&&!person.historicalPeriods?.includes(params.period as never))return false;
    if(!q)return true;
    const haystack=[person.name,person.nativeName,...(person.alternateNames??[]),...person.countries,...person.categories,...person.occupations,...(person.knownFor??[])].join(' ').toLocaleLowerCase();
    return haystack.includes(q);
  });
  const stats=await getVoteStats();
  const rows=people.map(person=>{const s=stats.get(person.id)??{likes:0,dislikes:0};return {...person,likes:s.likes,dislikes:s.dislikes,netLikes:s.likes-s.dislikes,rank:0,userVote:'none' as const};});
  const sort=params.sort??'rank';
  rows.sort((a,b)=>{if(sort==='likes')return b.likes-a.likes||b.dislikes-a.dislikes||a.name.localeCompare(b.name);if(sort==='dislikes')return b.dislikes-a.dislikes||b.likes-a.likes||a.name.localeCompare(b.name);if(sort==='name')return a.name.localeCompare(b.name);if(sort==='country')return a.countries[0].localeCompare(b.countries[0])||a.name.localeCompare(b.name);return b.netLikes-a.netLikes||b.likes-a.likes||a.name.localeCompare(b.name)||a.id.localeCompare(b.id);});
  rows.forEach((row,index)=>{row.rank=index+1;});
  const votes=await getUserVotes(rows.map(row=>row.id));
  return rows.map(row=>({...row,userVote:votes.get(row.id)??'none'})) satisfies RankedPerson[];
}

export async function getPerson(slug:string){return PUBLIC_PEOPLE.find(person=>person.slug===slug);}
