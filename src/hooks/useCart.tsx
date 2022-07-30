import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
    children: ReactNode;
}

interface UpdateProductAmount {
    productId: number;
    amount: number;
}

interface CartContextData {
    cart: Product[];
    addProduct: (productId: number) => Promise<void>;
    removeProduct: (productId: number) => void;
    updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
    const [cart, setCart] = useState<Product[]>(() => {
        const storagedCart = localStorage.getItem('@RocketShoes:cart');

        if (storagedCart) {
            return JSON.parse(storagedCart);
        }

        return [];
    });

    const addProduct = async (productId: number) => {
        try {
            const newCart = [...cart];
            const productCart = cart.find(product => product.id === productId);
            const stock = await api.get<Stock>(`stock/${productId}`);

            if (productCart) {
                const qtdStock = stock.data.amount;
                const currentQtd = productCart ? productCart.amount : 0;
                const qtd = currentQtd + 1;
                if (qtd > qtdStock) {
                    toast.error('Quantidade solicitada fora de estoque');
                    return;
                }

                productCart.amount += 1;


                localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
                setCart(newCart);
            } else {
                const product = await api.get(`products/${productId}`);

                const bodyProduct = {
                    ...product.data,
                    amount: 1,
                }
                newCart.push(bodyProduct);
                setCart(newCart);
                localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
            }

        } catch {
            toast.error('Erro na adição do produto');
        }
    };

    const removeProduct = (productId: number) => {
        try {
            const newCart = [...cart];

            const productExists = newCart.find((product) => {
                if (product.id === productId)
                    return product.id === productId;
                else
                    toast.error('Erro na remoção do produto');
            })

            if (productExists) {
                const productCarts = newCart.filter((product: Product) => {
                    return product.id !== productId;
                });

                if (productCarts) {
                    setCart(productCarts);

                    localStorage.setItem('@RocketShoes:cart', JSON.stringify(productCarts));

                } else {
                    throw Error('Erro na remoção do produto');

                }
            }



        } catch {
            toast.error('Erro na remoção do produto');
        }
    };

    const updateProductAmount = async ({
        productId,
        amount,
    }: UpdateProductAmount) => {
        try {
            if (amount <= 0) return;

            const productInCart = cart.find(product => product.id === productId);

            if (!productInCart) {
                toast.error('Erro na alteração de quantidade do produto');
                return;
            }

            const { data: productStock } = await api.get<Stock>(`/stock/${productId}`);

            if (productStock.amount < amount) {
                toast.error('Quantidade solicitada fora de estoque');
                return;
            }

            productInCart.amount = amount;

            const newCart = [...cart];

            localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
            setCart(newCart);
        } catch {
            toast.error('Erro na alteração de quantidade do produto');
        }
    };

    return (
        <CartContext.Provider
            value={{ cart, addProduct, removeProduct, updateProductAmount }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart(): CartContextData {
    const context = useContext(CartContext);

    return context;
}
