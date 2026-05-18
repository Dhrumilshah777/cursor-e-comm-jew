"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl, getDemoUserPhone } from "@/lib/api";

export function useOrderSummary(orderId: string | null) {
  const [orderNumber, setOrderNumber] = useState<string | undefined>();

  useEffect(() => {
    if (!orderId) {
      setOrderNumber(undefined);
      return;
    }

    const url = new URL(`/api/orders/${orderId}`, getApiBaseUrl());
    url.searchParams.set("phone", getDemoUserPhone());

    fetch(url.toString())
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { order?: { orderNumber: string } } | null) => {
        setOrderNumber(data?.order?.orderNumber);
      })
      .catch(() => {
        setOrderNumber(undefined);
      });
  }, [orderId]);

  return orderNumber;
}
