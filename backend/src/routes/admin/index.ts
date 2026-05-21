import { Router } from "express";
import { requireAdmin } from "../../middleware/requireAdmin.js";
import { adminAuthRouter } from "./auth.js";
import { adminReturnsRouter } from "./returns.js";
import { adminOrdersRouter } from "./orders.js";
import { adminProductsRouter } from "./products.js";
import { adminCustomersRouter } from "./customers.js";
import { adminDashboardRouter } from "./dashboard.js";
import { adminHomepageRouter } from "./homepage.js";

export const adminRouter = Router();

adminRouter.use("/auth", adminAuthRouter);

adminRouter.use(requireAdmin);
adminRouter.use("/returns", adminReturnsRouter);
adminRouter.use("/orders", adminOrdersRouter);
adminRouter.use("/products", adminProductsRouter);
adminRouter.use("/homepage", adminHomepageRouter);
adminRouter.use("/customers", adminCustomersRouter);
adminRouter.use("/dashboard", adminDashboardRouter);
