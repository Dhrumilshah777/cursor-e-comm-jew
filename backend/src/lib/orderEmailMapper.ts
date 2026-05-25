import type { Address, Order, OrderItem } from "../generated/prisma/client.js";
import { formatDisplayDate } from "./format.js";
import type { OrderEmailData } from "./emailTemplates/orderEmails.js";

type OrderForEmail = Order & {
  items: OrderItem[];
  deliveryAddress: Address;
};

export function buildOrderEmailData(
  order: OrderForEmail,
  customerEmail: string,
): OrderEmailData {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.deliveryAddress.name,
    placedAtLabel: formatDisplayDate(order.placedAt),
    totalPaise: order.totalPaise,
    goldValuePaise: order.goldValuePaise,
    makingChargePaise: order.makingChargePaise,
    gstPaise: order.gstPaise,
    shippingPaise: order.shippingPaise,
    discountPaise: order.discountPaise,
    couponCode: order.couponCode,
    paymentMethod: order.paymentMethod,
    transactionId: order.transactionId,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      image: item.image,
      size: item.size,
    })),
    deliveryAddress: {
      name: order.deliveryAddress.name,
      line1: order.deliveryAddress.line1,
      line2: order.deliveryAddress.line2 ?? "",
      city: order.deliveryAddress.city,
      state: order.deliveryAddress.state,
      pincode: order.deliveryAddress.pincode,
      phone: order.deliveryAddress.phone,
    },
    customerEmail,
  };
}
