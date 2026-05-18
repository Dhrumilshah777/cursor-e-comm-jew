import { Router } from "express";
import { getAdminCustomerById, listAdminCustomers } from "../../services/adminCustomers.js";

export const adminCustomersRouter = Router();

adminCustomersRouter.get("/", async (_req, res) => {
  try {
    const customers = await listAdminCustomers();
    res.json({ customers });
  } catch (error) {
    console.error("GET /api/admin/customers failed:", error);
    res.status(500).json({ error: "Failed to load customers" });
  }
});

adminCustomersRouter.get("/:id", async (req, res) => {
  try {
    const customer = await getAdminCustomerById(req.params.id);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json({ customer });
  } catch (error) {
    console.error(`GET /api/admin/customers/${req.params.id} failed:`, error);
    res.status(500).json({ error: "Failed to load customer" });
  }
});
