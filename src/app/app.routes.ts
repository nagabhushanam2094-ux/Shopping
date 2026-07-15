import { Routes } from '@angular/router';
import { Home } from './home/home';
import { About } from './about/about';
import { Cart } from './cart/cart';
import { Checkout } from './checkout/checkout';
import { Dresses } from './dresses/dresses';
import { Login } from './login/login';
import { Signup } from './signup/signup';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';
import { AuthGuard } from './guards/auth.guard';
import { Rest } from './rest/rest';
import { Orders } from './orders/orders';
import { Database } from './database/database';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'signup', component: Signup },
  { path: 'forgot-password', component: ForgotPassword },
  { path: 'reset-password', component: ResetPassword },
  { path: 'checkout', component: Checkout, canActivate: [AuthGuard] },
  { path: '', component: Home, canActivate: [AuthGuard] },
  { path: 'about', component: About, canActivate: [AuthGuard] },
  { path: 'dresses', component: Dresses, canActivate: [AuthGuard] },
  { path: 'cart', component: Cart, canActivate: [AuthGuard] },
  { path: 'rest', component: Rest, canActivate: [AuthGuard] },
  { path: 'orders', component: Orders, canActivate: [AuthGuard] },
  { path: 'database', component: Database, canActivate: [AuthGuard] }
];
