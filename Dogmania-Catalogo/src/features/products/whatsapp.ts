import type { Product } from "./model";
import { formatPrice } from "@/lib/currency";
import { WHATSAPP_NUMBER } from "@/config/store";

export const buildWhatsappLink = (product: Product) => {
  const message = `Olá! Tenho interesse no produto *${product.name}* no valor de ${formatPrice(product.price)}. Está disponível?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};

export const buildWhatsappDetailLink = (product: Product) => {
  const message = [
    `Olá! Venho da página do produto *${product.name}* no catálogo da Dogmania.`,
    "",
    `Categoria: ${product.category}`,
    `Preço anunciado: ${formatPrice(product.price)}`,
    "",
    "Ele está disponível em estoque?",
    "Como funciona a entrega (ou a retirada)?",
    "Quais são as formas de pagamento?",
  ].join("\n");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
};
