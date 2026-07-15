import { createAction, props } from '@ngrx/store';

export interface CartItem {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
}

export const addToCart = createAction(
  '[Cart] Add Item',
  props<{ item: CartItem }>()
);

export const removeFromCart = createAction(
  '[Cart] Remove Item',
  props<{ itemId: number }>()
);

export const updateCartItemQuantity = createAction(
  '[Cart] Update Item Quantity',
  props<{ itemId: number; quantity: number }>()
);

export const clearCart = createAction(
  '[Cart] Clear Cart'
);

export const getCartTotal = createAction(
  '[Cart] Get Cart Total'
);
