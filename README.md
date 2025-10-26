# 🛍️ Expo E-Commerce App (Frontend)

A mobile e-commerce client built with **Expo Router** and **React Native**, featuring secure authentication, product discovery (search, filters, sorting), wishlist, cart/bag with coupons, multi-address management, and a robust checkout/order flow synced with the **Express/MongoDB backend**.  
Includes performance safeguards against infinite re-renders and flaky network states.

---

## ⚙️ Tech Stack

- **Framework**: Expo (Managed), React Native, Expo Router  
- **Storage**: AsyncStorage / SecureStore for tokens  
- **Networking**: Axios for API calls  
- **UI Components**: FlatList / SectionList, Image gallery with auto-scroll and graceful fallback  
- **State Management**: Context Hooks (Auth, Cart, Wishlist)  
- **Optimizations**: Debounced search, guarded effects to prevent loops  

---

## 🚀 App Features

### 🔐 Authentication
- Register / Login with token persistence  
- Protected screens & profile loading after authentication  

### 🛒 Products
- Product listing & detail pages  
- Multi-filter, sort, and search overlay (Enter key preserved)  

### ❤️ Wishlist
- Add / remove from product cards and PDP with instant UI sync  

### 🧺 Cart / Bag
- Add / update / remove products  
- Apply / remove coupon  
- Stable image rendering on bag and order views  

### 🏠 Addresses
- Add / edit / delete addresses  
- Default selection with overlay UX fixes  

### 📦 Orders
- Create from cart with success screen  
- Clear bag on success with retry-safe flow  

---

## 📁 Project Structure

* `app/` → Expo Router screens and tabs
* `components/` → Shared UI (ProductCard, QuantityStepper, AddressForm, CouponBar)
* `contexts/` → AuthContext, CartContext, WishlistContext
* `lib/` → API client, interceptors, debounce, formatters
* `hooks/` → useAuth, useCart, useWishlist, usePaginatedProducts, useDebouncedValue
* `assets/` → Icons, placeholders

## 🔧 Environment Setup

Create a `.env` file in the project root:
```env
EXPO_PUBLIC_API_BASE=http://localhost:4000
EXPO_PUBLIC_CDN_BASE=<your_cdn_url>
EXPO_PUBLIC_ENV=dev
```

🧠 iOS/Android/Web debug origins must match backend CORS_ORIGIN.

## 🏃‍♂️ Install & Run

Install dependencies
```bash
npm install
```

Start development server
```bash
npx expo start
```

This opens the Expo Dev Tools — you can run the app on iOS, Android, or Web.

If the Web build shows blank or localhost issues, confirm:
* EXPO_PUBLIC_API_BASE is correct
* Expo Router paths are properly configured

## 🔐 API Client & Auth Flow

* Axios instance uses EXPO_PUBLIC_API_BASE as baseURL.
* Access token added in Authorization header.
* Refresh token interceptor reissues access token and retries once.
* On hard failures → automatic logout.

## 🖼️ Key Screens

* **Home / Category**: Product grid with filters, sort, pagination
* **Product Detail**: Image carousel with smooth transitions (last→first wrap)
* **Wishlist**: Optimistic UI updates + server reconciliation
* **Bag**: Line items, qty updates, coupon bar, computed totals
* **Address Book**: CRUD operations, default address, confirm before delete
* **Checkout / Orders**: Preview + success page, idempotent submit (prevents duplicate orders)

## ⚡ Reliability & Performance

* Debounced search and guarded useEffect to prevent "maximum update depth exceeded"
* Defensive rendering for missing images / optional fields
* Error boundaries + toasts for API failures
* Retry buttons for transient errors

## 💡 Usage Notes

* Search overlay "Enter" keeps page open while updating results
* Image placeholders prevent layout shifts during CDN delay
* After successful order → bag clears and UI resets

## 🧩 Troubleshooting

* Web build error ("Unexpected text node") → verify JSX returns / conditionals
* Blank screen → check Expo logs, API base, and CORS host match
* Infinite re-render in overlays → ensure stable dependencies and close actions

## 🧰 Scripts
```
npm run dev          # alias to expo start
npm run lint         # run linter
npm run typecheck    # (if using TypeScript)
npm run build:web    # build for Expo Web
```

## ✅ QA Checklist

| Feature | Expected Behavior |
|---------|-------------------|
| Auth | Login → profile hydrated, redirects unauth users |
| Wishlist | Add/remove reflects instantly across screens |
| Cart | Qty & coupon updates recalculate totals |
| Addresses | Default selection persists, used at checkout |
| Orders | Success clears bag; retry doesn't duplicate orders |
| Filters / Sort | Consistent across list, search, navigation |

## 🤝 Contributing

* Use feature branches and conventional commits
* Include screen recordings for UI flows in PRs
* Attach before/after screenshots for visual changes (e.g. image gallery, overlays)
