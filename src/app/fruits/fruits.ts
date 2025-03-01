import { Category } from "../category/category";

export interface Fruits {
    id: number;
  name: string;
  quantity: number;
  price: number;
  category:Category;
}
