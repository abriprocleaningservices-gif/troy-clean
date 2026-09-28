import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { StickyBookNow } from "@/components/layout/StickyBookNow";
import { HomePage } from "@/pages/HomePage";
import { ServicesPage } from "@/pages/ServicesPage";
import { ServiceDetailPage } from "@/pages/ServiceDetailPage";
import { BookingPage } from "@/pages/BookingPage";
import { BookingConfirmedPage } from "@/pages/BookingConfirmedPage";
import { CommercialLeadPage } from "@/pages/CommercialLeadPage";
import { PropertyManagerPage } from "@/pages/PropertyManagerPage";
import { AboutPage } from "@/pages/AboutPage";
import { AdminLoginPage } from "@/pages/AdminLoginPage";
import { AdminDashboardPage } from "@/pages/AdminDashboardPage";
import { CleanerLoginPage } from "@/pages/CleanerLoginPage";
import { CleanerDashboardPage } from "@/pages/CleanerDashboardPage";
import { CustomerPortalPage } from "@/pages/CustomerPortalPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
          <Route path="/book" element={<BookingPage />} />
          <Route path="/book/confirmed" element={<BookingConfirmedPage />} />
          <Route path="/commercial" element={<CommercialLeadPage />} />
          <Route path="/property-managers" element={<PropertyManagerPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/portal" element={<CustomerPortalPage />} />
          <Route path="/cleaner" element={<CleanerLoginPage />} />
          <Route path="/cleaner/dashboard" element={<CleanerDashboardPage />} />
          <Route path="/admin" element={<AdminLoginPage />} />
          <Route path="/admin/dashboard/*" element={<AdminDashboardPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
      <StickyBookNow />
    </div>
  );
}
