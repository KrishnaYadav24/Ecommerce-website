import {
	BrowserRouter,
	Routes,
	Route,
	Link,
} from "react-router-dom";

import Header from "./components/Header";

import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailsPage from "./pages/ProductDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderSuccessPage from "./pages/OrderSuccessPage";
import PaymentPage from "./pages/PaymentPage";
import NetBankingPage from "./pages/NetBankingPage";
import CreditCardPaymentPage from "./pages/CreditCardPaymentPage";
import AdminCatalog from "./pages/AdminCatalog";
import AdminDashboard from "./pages/AdminDashboard";
import AdminOrders from "./pages/AdminOrders";
import AdminReturnsRefunds from "./pages/AdminReturnsRefunds";


function PlaceholderPage({ title, description }) {
	return (
		<main style={{ padding: "70px 7%", minHeight: "55vh" }}>
			<p
				style={{
					fontSize: 10,
					letterSpacing: 2,
					color: "#77766e",
				}}
			>
				SHOPNOVA
			</p>

			<h1 style={{ fontSize: 42, fontWeight: 500 }}>
				{title}
			</h1>

			<p style={{ color: "#77766e", lineHeight: 1.8 }}>
				{description}
			</p>

			<Link to="/products" style={{ color: "#171715" }}>
				Explore products →
			</Link>
		</main>
	);
}

function NotFoundPage() {
	return (
		<PlaceholderPage
			title="Page not found"
			description="The page you are looking for doesn't exist."
		/>
	);
}

function App() {
	return (
		<BrowserRouter>
			<Header />

			<Routes>
				{/* Customer storefront */}
				<Route path="/" element={<HomePage />} />

				<Route path="/products" element={<ProductsPage />} />

				<Route
					path="/products/:id"
					element={<ProductDetailsPage />}
				/>

				{/* Login and registration */}
				<Route path="/login" element={<LoginPage />} />

				<Route path="/register" element={<RegisterPage />} />

				{/* Customer account */}
				<Route path="/account" element={<ProfilePage />} />

				<Route path="/cart" element={<CartPage />} />

				<Route path="/orders" element={<MyOrdersPage />} />

				<Route path="/checkout" element={<CheckoutPage />} />

				<Route
					path="/order-success"
					element={<OrderSuccessPage />}
				/>

				<Route path="/payment" element={<PaymentPage />} />

				<Route
					path="/card-payment"
					element={<CreditCardPaymentPage />}
				/>

				<Route
					path="/netbanking-payment"
					element={<NetBankingPage />}
				/>

				{/* Admin dashboard */}
				<Route path="/admin" element={<AdminDashboard />} />

				<Route
					path="/admin/dashboard"
					element={<AdminDashboard />}
				/>

				{/* Admin order management */}
				<Route
					path="/admin/orders"
					element={<AdminOrders />}
				/>

				{/* Keep wildcard route last */}
				<Route path="*" element={<NotFoundPage />} />

				<Route path="/admin/catalog" element={<AdminCatalog />} />

				<Route
					path="/admin/returns-refunds" element={<AdminReturnsRefunds />}
				/>

			</Routes>
		</BrowserRouter>
	);
}

export default App;