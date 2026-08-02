import { NextResponse } from "next/server";
import Midtrans from "midtrans-client";

export async function POST(req: Request) {
  try {
    // Cek apakah body berhasil diterima
    const body = await req.json();

    // Cek apakah Server Key terbaca
    if (!process.env.MIDTRANS_SERVER_KEY) {
      throw new Error("FATAL: MIDTRANS_SERVER_KEY tidak ditemukan di .env.local");
    }
    
    const snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY as string,
    });

    const parameter = {
      transaction_details: {
        order_id: body.order_id,
        gross_amount: Math.round(body.gross_amount),
      },
      customer_details: {
        first_name: body.first_name,
      },
    };

    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({ token: transaction.token });
  } catch (error: any) {
    console.error("Midtrans Error:", error.message);
    return NextResponse.json({ error: "Gagal membuat token pembayaran" }, { status: 500 });
  }
}