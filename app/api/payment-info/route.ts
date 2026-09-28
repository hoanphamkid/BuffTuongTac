import {NextResponse} from 'next/server';
const bank={id:process.env.BANK_ID||'MB',accountNumber:process.env.BANK_ACCOUNT_NUMBER||'0945459491',accountName:process.env.BANK_ACCOUNT_NAME||'PHẠM THANH HOÀN'};
export async function GET(){return NextResponse.json({success:true,data:{bankId:bank.id,accountNumber:bank.accountNumber,accountName:bank.accountName,configured:true}});}
