import { createReducer, on } from '@ngrx/store';
import { CartItem, addToCart, removeFromCart, updateCartItemQuantity, clearCart } from './cart.actions';

export interface CartState {
  items: CartItem[];
}

export const initialCartState: CartState = {
  items: [],
};

export const cartReducer = createReducer(
  initialCartState,
  on(addToCart, (state, { item }) => {
    const existingItem = state.items.find(i => i.id === item.id);
    if (existingItem) {
      return {
        ...state,
        items: state.items.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + item.quantity } : i
        ),
      };
    }
    return {
      ...state,
      items: [...state.items, item],
    };
  }),
  on(removeFromCart, (state, { itemId }) => ({
    ...state,
    items: state.items.filter(i => i.id !== itemId),
  })),
  on(updateCartItemQuantity, (state, { itemId, quantity }) => ({
    ...state,
    items: state.items.map(i =>
      i.id === itemId ? { ...i, quantity } : i
    ),
  })),
  on(clearCart, (state) => ({
    ...state,
    items: [],
  }))
);
