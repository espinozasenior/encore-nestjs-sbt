import { Injectable } from "@nestjs/common";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

@Injectable()
export class SecurityService {
  encryptAES256(plainText: string, secretKey: string): string {
    const iv = Buffer.from(randomBytes(16));

    const cipher = createCipheriv("aes-256-cbc", secretKey, iv);

    let encrypted = cipher.update(plainText, "utf8", "base64");
    encrypted += cipher.final("base64");

    const ivHex = iv.toString("hex");
    return ivHex + encrypted;
  }

  decryptAES256(cipherText: string, secretKey: string): string {
    const ivHex = cipherText.slice(0, 32); // 16 bytes
    const iv = Buffer.from(ivHex, "hex");

    const encryptedText = cipherText.slice(32);

    const decipher = createDecipheriv("aes-256-cbc", secretKey, iv);

    let decrypted = decipher.update(encryptedText, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}
