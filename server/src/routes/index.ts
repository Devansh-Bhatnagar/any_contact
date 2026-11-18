import { Router } from "express";
import authRoutes from "./auth.routes";
import categoriesRoutes from "./categories.routes";
import businessesRoutes from "./businesses.routes";
import servicesStandaloneRoutes from "./servicesStandalone.routes";
import productsStandaloneRoutes from "./productsStandalone.routes";
import promotionsStandaloneRoutes from "./promotionsStandalone.routes";
import notificationsRoutes from "./notifications.routes";
import searchRoutes from "./search.routes";
import adminRoutes from "./admin.routes";
import uploadsRoutes from "./uploads.routes";
import phonebookRoutes from "./phonebook.routes";
import businessContactsRoutes from "./businessContacts.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoriesRoutes);
router.use("/businesses", businessesRoutes);
router.use("/services", servicesStandaloneRoutes);
router.use("/products", productsStandaloneRoutes);
router.use("/promotions", promotionsStandaloneRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/search", searchRoutes);
router.use("/admin", adminRoutes);
router.use("/uploads", uploadsRoutes);
router.use("/phonebook", phonebookRoutes);
router.use("/business-contacts", businessContactsRoutes);

export default router;
