import {NextResponse} from 'next/server'; export async function POST(){const r=NextResponse.json({success:true});r.cookies.set('smm_session','',{maxAge:0,path:'/'});return r;}
