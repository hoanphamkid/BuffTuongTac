import { NextResponse } from 'next/server';

const bank = {
  id: process.env.BANK_ID || '',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '',
  accountName: process.env.BANK_ACCOUNT_NAME || '',
};

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      bankId: bank.id,
      accountNumber: bank.accountNumber,
      accountName: bank.accountName,
      configured: Boolean(bank.id && bank.accountNumber && bank.accountName),
    },
  });
}
