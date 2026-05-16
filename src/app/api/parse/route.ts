import { NextResponse } from "next/server";
// @ts-ignore
import pdfParse from "pdf-parse/lib/pdf-parse.js";
// @ts-ignore
import mammoth from "mammoth";
import * as xlsx from "xlsx";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";

    const nameLower = file.name.toLowerCase();

    if (nameLower.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      text = data.text;
    } else if (nameLower.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (nameLower.endsWith(".xlsx") || nameLower.endsWith(".xls") || nameLower.endsWith(".csv")) {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      text = xlsx.utils.sheet_to_csv(worksheet);
    } else {
      // Fallback for .txt, .md, .json, etc.
      text = buffer.toString("utf-8");
    }

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Parse API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse file" }, { status: 500 });
  }
}
